var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');

function Query(sql, callback)
{
  Command.call(this);
  this.query = sql;
  this.onResult = callback; // TODO check felixge multi-result api
  this.fieldCount = 0;
  this.insertId   = 0;
  this.fields     = [];
  this.rows       = [];
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

Query.prototype.readField = function(packet) {
  var field = new Packets.ColumnDefinition(packet);
  this.fields.push(field);
  if (this.fields.length == this.fieldCount)
    return Query.prototype.fieldsEOF;
  return Query.prototype.readField;
};

Query.prototype.fieldsEOF = function(packet) {
  // check EOF
  if (!packet.isEOF())
    throw "Expected EOF packet";
  // PROFILING
  this._fieldsEOFTime = process.hrtime();
  return Query.prototype.row;
};

function Row(columns) {
  this.id = columns[0];
  this.name = columns[1];
}

Query.prototype.row = function(packet)
{
  if (packet.isEOF()) {
    if (this.onResult)
      this.onResult(null, this.rows, this.fields);
    return null;
  }
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
