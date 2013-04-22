var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');

function Execute(sql, parameters, callback)
{
  Command.call(this);
  this.query = sql;
  this.onResult = callback; // TODO check felixge multi-result api
  this.fieldCount = 0;
  this.parameterCount = 0;
  this.fields = [];
  this.parameterDefinitions = [];

  this.resultFields = [];
  this.resultFieldCount = 0;
  this.insertId = 0;

  this.parameters = parameters;
  this.rows   = [];
  this.id = 0;
}
util.inherits(Execute, Command);

Execute.prototype.start = function(packet, connection) {
  var id = connection.statements[this.query];
  if (!id) { // prepare first
    console.log('preparing ' + this.query);
    connection.writePacket(new Packets.PrepareStatement(this.query).toPacket(1));
  } else {
    this.id = id;
    //console.log('executing cached! ID=' + this.id);
    return this.doExecute(connection);
  }
  return Execute.prototype.prepareHeader;
};

Execute.prototype.prepareHeader = function(packet, connection) {
  var header = new Packets.PreparedStatementHeader(packet);
  this.fieldCount     = header.fieldCount;
  this.parameterCount = header.parameterCount;
  this.id = header.id;
  console.log('saving prepared statement:' + this.id);
  connection.statements[this.query] = this.id;
  if (this.parameterCount > 0)
    return Execute.prototype.readParameter;
  else if (this.fieldCount > 0)
    return Execute.prototype.readField;
  else
    return this.doExecute(connection);
};

Execute.prototype.readParameter = function(packet) {
  var def = new Packets.ColumnDefinition(packet);
  this.parameterDefinitions.push(def);
  if (this.parameterDefinitions.length == this.parameterCount)
    return Execute.prototype.parametersEOF;
  return this.doExecute();
};

Execute.prototype.readField = function(packet) {
  var def = new Packets.ColumnDefinition(packet);
  this.fields.push(def);
  if (this.fields.length == this.fieldCount) {
    return Execute.prototype.fieldsEOF;
  }
  return Execute.prototype.readField;
};

Execute.prototype.parametersEOF = function(packet, connection) {
  // check EOF
  if (!packet.isEOF())
    throw "Expected EOF packet";
  if (this.fieldCount > 0)
    return Execute.prototype.readField;
  else
    return this.doExecute(connection);
};

Execute.prototype.fieldsEOF = function(packet, connection) {
  // check EOF
  if (!packet.isEOF())
    throw "Expected EOF packet";
  return this.doExecute(connection);
};

Execute.prototype.doExecute = function(connection)
{
  var executePacket = new Packets.Execute(this.id, this.parameters);
  connection.writePacket(executePacket.toPacket(1));
  return Execute.prototype.resultesetHeader;
};

Execute.prototype.resultesetHeader = function(packet) {
  var header = new Packets.ResultSetHeader(packet);
  this.resultFieldCount = header.fieldCount;
  this.insertId = header.insertId;
  if (this.resultFieldCount === 0) {
    if (this.onResult)
      this.onResult(null, [], []);
    return null;
  }
  return Execute.prototype.readResultField;
};

Execute.prototype.readResultField = function(packet) {
  var def = new Packets.ColumnDefinition(packet);
  this.resultFields.push(def);
  if (this.resultFields.length == this.resultFieldCount) {
    return Execute.prototype.resultFieldsEOF;
  }
  return Execute.prototype.readResultField;
};

Execute.prototype.resultFieldsEOF = function(packet) {
  // check EOF
  if (!packet.isEOF())
    throw "Expected EOF packet";
  return Execute.prototype.row;
};

Execute.prototype.row = function(packet)
{
  // TODO: refactor to share code with Query::row
  if (packet.isEOF()) {
    if (this.onResult)
      this.onResult(null, this.rows, this.fields);
    return null;
  }
  var row = Packets.BinaryRow.fromPacket(this.fields, packet);
  // TODO: here we'll have dynamically pre-compiled and cached row parser
  if (true) // TODO: think of API to store raw copulns array (most probably connection options flags)
  {
    var r = {};
    for (var i = 0; i < row.columns.length; ++i)
    {
      var name = this.resultFields[i].name;
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
  return Execute.prototype.row;
};

module.exports = Execute;
