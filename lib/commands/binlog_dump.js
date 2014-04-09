var Command  = require('./command');
var util    = require('util');
var CommandCode = require('../constants/commands');
var Packets = require('../packets');

function BinlogDump(opts)
{
  Command.call(this);
  //this.onResult = callback;
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
  this.serverId  = packet.readInt32();
  this.eventSize = packet.readInt32();
  this.logPos    = packet.readInt32();
  this.flags     = packet.readInt16();
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
  this.eventsLength  = packet.readBuffer();
  this.name = 'FormatDescriptionEvent';
}

function QueryEvent(packet) {
  
  var parseStatusVars = require('../packets/binlog_query_statusvars.js');

  this.slaveProxyId  = packet.readInt32();
  this.executionTime = packet.readInt32();
  var schemaLength  = packet.readInt8();
  this.errorCode     = packet.readInt16();
  var statusVarsLength = packet.readInt16();
  var statusVars = packet.readBuffer(statusVarsLength);
  
  this.schema = packet.readString(schemaLength);
  packet.readInt8(); // should be zero
  this.statusVars = parseStatusVars(statusVars);
  
  this.query = packet.readString();
  this.name = 'QueryEvent';
}

function XidEvent(packet) {
  this.binlogVersion = packet.readInt16();
  this.xid = packet.readInt64();
  this.name = 'XidEvent';
}

var eventParsers = [];

eventParsers[2]  = QueryEvent;
eventParsers[4]  = RotateEvent;
eventParsers[15] = FormatDescriptionEvent;
eventParsers[16] = XidEvent;

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
  if (EventParser)
    event = new EventParser(packet);
  else {
    event = {
      name: 'UNKNOWN'
    }
  }
  event.header = header;
  this.emit('event', event);
  return BinlogDump.prototype.binlogData;
};

module.exports = BinlogDump;
