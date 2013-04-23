var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');
var compileParser = require('../compile_text_parser');

function Query(sql, callback)
{
  Command.call(this);
  this.query = sql;
  this.onResult = callback; // TODO check felixge multi-result api
  this.fieldCount = 0;
  this.insertId   = 0;
  this.fields     = [];
  this.rows       = [];
  this.rowParser  = null;
}
util.inherits(Query, Command);

Query.prototype.start = function(packet, connection) {
  var cmdPacket = new Packets.Query(this.query);
  connection.writePacket(cmdPacket.toPacket(1));
  return Query.prototype.resultsetHeader;
};

Query.prototype.resultsetHeader = function(packet) {
  var rs = new Packets.ResultSetHeader(packet);
  this.fieldCount = rs.fieldCount;
  this.insertId = rs.insertId;
  if (this.fieldCount === 0) {
    if (this.onResult)
      this.onResult(null, [], []);
    return null;
  }
  return Query.prototype.readField;
};

function getFieldsKey(fields) {
  var res = '';
  for (var i=0; i < fields.length; ++i)
    res += '/' + fields[i].name + ':' + fields[i].columnType;
  return res;
}

Query.prototype.readField = function(packet, connection) {
  var field = new Packets.ColumnDefinition(packet);
  this.fields.push(field);
  if (this.fields.length == this.fieldCount) {
    var parserKey = getFieldsKey(this.fields);
    // try cached first
    this.rowParser = connection.textProtocolParsers[parserKey];
    if (!this.rowParser) {
      this.rowParser = compileParser(this.fields);
      connection.textProtocolParsers[parserKey] = this.rowParser;
    }
    return Query.prototype.fieldsEOF;
  }
  return Query.prototype.readField;
};

Query.prototype.fieldsEOF = function(packet) {
  // check EOF
  if (!packet.isEOF())
    throw "Expected EOF packet";
  return Query.prototype.row;
};

Query.prototype.row = function(packet)
{
  if (packet.isEOF()) {
    if (this.onResult)
      this.onResult(null, this.rows, this.fields);
    return null;
  }

  if (this.rowParser) {
    // compiled version:
    // TODO: compile (and assign to this.next) whole command handler, not just row constructor+parser?
    var row = new this.rowParser(packet);
    if (this.onResult)
      this.rows.push(row);
    else
      this.emit('result', row);
    return Query.prototype.row;
  }

  // non-compiled
  var row = Packets.TextRow.fromPacket(packet);
  // TODO: here we'll have dynamically pre-compiled and cached row parser
  if (true) // TODO: think of API to store raw copulns array (most probably connection options flags)
  {
    var r = {};
    for (var i = 0; i < row.columns.length; ++i)
    {
      var name = this.fields[i].name;
      r[name] = row.columns[i];
    }
    if (this.onResult)
      this.rows.push(r);
    else
      this.emit('result', r);
  } else {
    if (this.onResult)
      this.rows.push(row.columns);
    else
      this.emit('result', row.columns);
  }
  return Query.prototype.row;
};

module.exports = Query;
