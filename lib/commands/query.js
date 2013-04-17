var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');

function Query(sql, callback)
{
  Command.call(this);
  this.query = sql;
  this.onResult = callback; // TODO check felixge multi-result api
  this.fieldCount = 0;
  this.fields = [];
  this.rows   = [];
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
    this.onResult(null, this.rows, this.fields);
    return null;
  }
  //console.log(this.rows.length);
  //console.log(this.rows);
  var row = Packets.TextRow.fromPacket(packet);
  if (process.env.QQQ)
    this.rows.push(['aaa', 'bbb']); //this.rows.push(new Row(row.columns));
  else //if (process.env.HASH) {
  {
    var r = {};
    for (var i = 0; i < row.columns.length; ++i)
    {
      var name = this.fields[i].name;
      r[name] = row.columns[i];
    }
    this.rows.push(r);
  } //else
    //this.rows.push(row.columns);

  return Query.prototype.row;
};

module.exports = Query;
