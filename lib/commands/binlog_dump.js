var Command = require('./command');
var util = require('util');
var CommandCode = require('../constants/commands');
var Types = require('../constants/types')
var Packets = require('../packets');

var tableMap = []

function BinlogDump(opts) {
  Command.call(this);
  // this.onResult = callback;
  this.opts = opts;
}
util.inherits(BinlogDump, Command);

BinlogDump.prototype.start = function(packet, connection) {
  var packet = new Packets.BinlogDump(this.opts);
  connection.writePacket(packet.toPacket(1));
  return BinlogDump.prototype.binlogData;
};

function BinlogEventHeader(packet) {
  this.timestamp = packet.readInt32();
  this.eventType = packet.readInt8();
  this.serverId = packet.readInt32();
  this.eventSize = packet.readInt32();
  this.logPos = packet.readInt32();
  this.flags = packet.readInt16();
}

function RotateEvent(packet) {
  this.pposition = packet.readInt32();
  // TODO: read uint64 here
  var positionDword2 = packet.readInt32();
  this.nextBinlog = packet.readString();
  this.name = 'RotateEvent';
}

function FormatDescriptionEvent(packet) {
  this.binlogVersion = packet.readInt16();
  this.serverVersion = packet.readString(50).replace(/\u0000.*/, '');
  this.createTimestamp = packet.readInt32();
  this.eventHeaderLength = packet.readInt8(); // should be 19
  this.eventsLength = packet.readBuffer();
  this.name = 'FormatDescriptionEvent';
}

function QueryEvent(packet) {
  var parseStatusVars = require('../packets/binlog_query_statusvars.js');

  this.slaveProxyId = packet.readInt32();
  this.executionTime = packet.readInt32();
  var schemaLength = packet.readInt8();
  this.errorCode = packet.readInt16();
  var statusVarsLength = packet.readInt16();
  var statusVars = packet.readBuffer(statusVarsLength);

  this.schema = packet.readString(schemaLength);
  packet.readInt8(); // should be zero
  this.statusVars = parseStatusVars(statusVars);

  this.query = packet.readString();
  this.name = 'QueryEvent';
}

function readPackedInteger (packet) {
  let packedLength = packet.readInt8();
  if (packedLength <= 250) {
    return packedLength;
  } else {
    switch(packedLength) {
      case 251:
        return null;
      case 252:
        return packet.readInt16();
      case 253:
        return packet.readInt24();
    }

    let low = packet.readInt32();
    let high = packet.readInt32();

    return low + (Math.pow(2, 32) * high);
  }
}

function readInt48(packet) {
  let low = packet.readInt32();
  let high = packet.readInt16();
  return low + (Math.pow(2, 32) * high);
}

function readByteArray(packet, size) {
  let byteArray = new Array(size)
  for (let i = 0; i < size; i++) {
    byteArray[i] = packet.readInt8()
  }
  return byteArray
}

function readColumnMetadata(packet, columnTypes) {
  let size = columnTypes.length
  let columnMetadata = new Array(size)

  for (let i = 0; i < size; i++) {
    let typeId = columnTypes[i]
    let result = {}
    switch(typeId) {
      case Types.FLOAT:
      case Types.DOUBLE:
        result = {
          size: packet.readInt8()
        };
        break;
      case Types.VARCHAR:
        result = {
          'max_length': packet.readInt16()
        };
        break;
      case Types.BIT:
        var bits = packet.readInt8();
        var bytes = packet.readInt8();
        result = {
          bits: bytes * 8 + bits
        };
        break;
      case Types.NEWDECIMAL:
        result = {
          precision: packet.readInt8(),
          decimals: packet.readInt8(),
        };
        break;
      case Types.BLOB:
      case Types.GEOMETRY:
      case Types.JSON:
        result = {
          'length_size': packet.readInt8()
        };
        break;
      case Types.STRING:
      case Types.VAR_STRING:
        // The STRING type sets a 'real_type' field to indicate the
        // actual type which is fundamentally incompatible with STRING
        // parsing. Setting a 'type' key in this hash will cause
        // TableMap event to override the main field 'type' with the
        // provided 'type' here.
        var metadata = (packet.readInt8() << 8) + packet.readInt8();
        var realType = metadata >> 8;
        if (realType === Types.ENUM
            || realType === Types.SET) {
          result = {
            type: realType,
            size: metadata & 0x00ff
          };
        } else {
          result = {
            'max_length': ((
              (metadata >> 4) & 0x300) ^ 0x300) + (metadata & 0x00ff)
          };
        }
        break;
      case Types.TIMESTAMP2:
      case Types.DATETIME2:
      case Types.TIME2:
        result = {
          decimals: packet.readInt8()
        };
        break;
    }
    columnMetadata[i] = result
  }

  return columnMetadata
}

function TableMapEvent(packet) {
  var parseStatusVars = require('../packets/binlog_query_statusvars.js');
  this.tableId = readInt48(packet);
  packet.readInt16() // Reserved for future use.

  let databaseNameLength = packet.readInt8();
  this.databaseName = packet.readString(databaseNameLength);
  packet.readInt8()

  let tableNameLength = packet.readInt8();
  this.tableName = packet.readString(tableNameLength);
  packet.readInt8()

  this.columnCount = readPackedInteger(packet)
  this.columnTypes = readByteArray(packet, this.columnCount);

  this.metadataBlockLength = readPackedInteger(packet)
  this.metadataBlock = readColumnMetadata(packet, this.columnTypes);
  this.name = 'TableMapEvent';

  tableMap[this.tableId] = this
}

function UpdateRowsEvent(packet) {
  this.tableId = readInt48(packet);
  this.flags = packet.readInt16();
  this.columnCount = readPackedInteger(packet)
  var tableData = tableMap[this.tableId];
  this.name = 'UpdateRowsEvent';
}

function XidEvent(packet) {
  this.binlogVersion = packet.readInt16();
  this.xid = packet.readInt64();
  this.name = 'XidEvent';
}

var eventParsers = [];

eventParsers[2] = QueryEvent;
eventParsers[4] = RotateEvent;
eventParsers[15] = FormatDescriptionEvent;
eventParsers[16] = XidEvent;
eventParsers[19] = TableMapEvent;
eventParsers[24] = UpdateRowsEvent;

BinlogDump.prototype.binlogData = function(packet) {
  // ok - continue consuming events
  // error - error
  // eof - end of binlog
  if (packet.isEOF()) {
    this.emit('eof');
    return null;
  }

  // binlog event header
  var ok = packet.readInt8();
  var header = new BinlogEventHeader(packet);
  var EventParser = eventParsers[header.eventType];
  var event;
  if (EventParser) {
    event = new EventParser(packet);
  } else {
    event = {
      name: 'UNKNOWN'
    };
  }
  event.header = header;
  this.emit('event', event);
  return BinlogDump.prototype.binlogData;
};

module.exports = BinlogDump;
