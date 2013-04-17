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

  this.parameters = parameters;
  this.rows   = [];
  this.id = 0;
}
util.inherits(Execute, Command);

Execute.prototype.start = function(packet, connection) {
  var id = connection.statements[this.sql];
  if (!id) { // prepare first
     connection.writePacket(new Packets.PrepareStatement(this.query).toPacket(1));
  } else {
    return this.doExecute(connection);
  }
  return Execute.prototype.resultsetHeader;
};

Execute.prototype.resultsetHeader = function(packet) {
  var header = new Packets.PreparedStatementHeader(packet);
  this.fieldCount     = header.fieldCount;
  this.parameterCount = header.parameterCount;
  if (this.parameterCount > 0)
    return Execute.prototype.readParameter;
  else if (this.fieldCount > 0)
    return Execute.prototype.readField;
  else
    return execute.prototype.parametersEOF;
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
  console.log('TODO: implement COM_EXECUTE. STMT id =' + this.id);
  this.onResult('');
};

Execute.prototype.row = function(packet)
{
  console.log('Execute:row', packet);
  return Execute.prototype.row;
};

module.exports = Execute;
