var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');
var compileParser = require('../compile_text_parser.js');
var ServerStatus = require('../constants/server_status.js');

function Query(sql, options, callback)
{
  Command.call(this);
  this.query = sql;
  this.options = options;
  this.onResult = callback;
  this._fieldCount = 0;
  this._rowParser  = null;
  this._fields     = [];
  this._rows       = [];
  this._receivedFieldsCount = 0;
  this._resultIndex = 0;
}
util.inherits(Query, Command);

Query.prototype.start = function(packet, connection) {
  if (connection.config.debug) {
    console.log('        Sending query command: %s', this.query);
  }
  var cmdPacket = new Packets.Query(this.query);
  connection.writePacket(cmdPacket.toPacket(1));
  return Query.prototype.resultsetHeader;
};

Query.prototype.done = function() {
  var self = this;
  if (this.onResult) {
    var rows, fields;
    if (this._resultIndex === 0) {
      rows = this._rows[0];
      fields = this._fields[0];
    } else {
      rows = this._rows;
      fields = this._fields;
    }
    if (fields) {
      process.nextTick(function() {
        self.onResult(null, rows, fields);
      });
    } else {
      process.nextTick(function() {
        self.onResult(null, rows);
      });
    }
  }
  return null;
};

Query.prototype.resultsetHeader = function(packet, connection) {
  var rs = new Packets.ResultSetHeader(packet, connection.config.bigNumberStrings);
  this._fieldCount = rs.fieldCount;
  if (connection.config.debug) {
    console.log('        Resultset header received, expecting ' + rs.fieldCount + ' column definition packets');
  }
  if (this._fieldCount === 0) {
    this._rows.push(rs);
    this._fields.push(void(0));
    this.emit('result', rs, this._resultIndex);
    this.emit('fields', void(0), this._resultIndex);
    if (rs.serverStatus & ServerStatus.SERVER_MORE_RESULTS_EXISTS) {
      this._resultIndex++;
      return Query.prototype.resultsetHeader;
    }
    return this.done();
  }

  this._receivedFieldsCount = 0;
  this._rows.push([]);
  this._fields.push([]);
  return Query.prototype.readField;
};

// TODO: move to connection.js ?
function getFieldsKey(fields, options) {
  var res = (typeof options.nestTables) + '/' + options.nestTables + '/' + options.rowsAsHash;
  for (var i=0; i < fields.length; ++i)
    res += '/' + fields[i].name + ':' + fields[i].columnType + ':' + fields[i].flags;
  return res;
}

Query.prototype.readField = function(packet, connection) {

  this._receivedFieldsCount++;

  // Often there is much more data in the column definition than in the row itself
  // If you set manually _fields[0] to array of ColumnDefinition's (from previous call)
  // you can 'cache' result of parsing. Field packets still received, but ignored in that case
  // this is the reason _receivedFieldsCount exist (otherwise we could just use current length of fields array)

  if (this._fields[this._resultIndex].length != this._fieldCount) {
    var field = new Packets.ColumnDefinition(packet);
    this._fields[this._resultIndex].push(field);
    if (connection.config.debug) {
      console.log('        Column definition:');
      console.log('          name: ' + field.name);
      console.log('          type: ' + field.columnType);
      console.log('         flags: ' + field.flags);
    }
  }

  // last field received
  if (this._receivedFieldsCount == this._fieldCount) {
    var fields = this._fields[this._resultIndex];
    this.emit('fields', fields, this._resultIndex);
    var parserKey = getFieldsKey(fields, this.options);
    this.rowParser = connection.textProtocolParsers[parserKey];
    if (!this.rowParser) {
      this.rowParser = compileParser(fields, this.options, connection.config);
      connection.textProtocolParsers[parserKey] = this.rowParser;
    }
    return Query.prototype.fieldsEOF;
  }
  return Query.prototype.readField;
};

Query.prototype.fieldsEOF = function(packet) {
  // check EOF
  if (!packet.isEOF())
    throw "Expected EOF packet"; // !!!TODO don't crash if there is a protocol error
  return Query.prototype.row;
};

Query.prototype.row = function(packet)
{
  if (packet.isEOF()) {
    var status = packet.eofStatusFlags();
    var moreResults = packet.eofStatusFlags() & ServerStatus.SERVER_MORE_RESULTS_EXISTS;
    if (moreResults) {
      this._resultIndex++;
      return Query.prototype.resultsetHeader;
    }
    return this.done();
  }

  var row = new this.rowParser(packet);
  if (this.onResult)
    this._rows[this._resultIndex].push(row);
  else
    this.emit('result', row, this._resultIndex);

  return Query.prototype.row;
};

module.exports = Query;
