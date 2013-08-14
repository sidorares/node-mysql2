var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');
var compileParser = require('../compile_binary_parser');

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
  this.statementInfo = null;
}
util.inherits(Execute, Command);

Execute.prototype.start = function(packet, connection) {
  var cachedStatement = connection.statements[this.query];
  if (!cachedStatement) { // prepare first
    connection.writePacket(new Packets.PrepareStatement(this.query).toPacket(1));
  } else {
    this.statementInfo = cachedStatement;
    return this.doExecute(connection);
  }
  return Execute.prototype.prepareHeader;
};

function PreparedStatementInfo(id) {
  this.id = id;
  this.parser = null;
}

Execute.prototype.prepareHeader = function(packet, connection) {
  var header = new Packets.PreparedStatementHeader(packet);
  this.fieldCount     = header.fieldCount;
  this.parameterCount = header.parameterCount;
  this.statementInfo = new PreparedStatementInfo(header.id);
  connection.statements[this.query] = this.statementInfo;
  if (this.parameterCount > 0)
    return Execute.prototype.readParameter;
  else if (this.fieldCount > 0)
    return Execute.prototype.readField;
  else
    return this.doExecute(connection);
};

Execute.prototype.readParameter = function(packet, connection) {
  var def = new Packets.ColumnDefinition(packet);
  this.parameterDefinitions.push(def);
  if (this.parameterDefinitions.length == this.parameterCount)
    return Execute.prototype.parametersEOF;
  return this.readParameter;
};

// TODO: move to connection.js?
function getFieldsKey(fields) {
  var res = '';
  for (var i=0; i < fields.length; ++i)
    res += '/' + fields[i].name + ':' + fields[i].columnType + ':' + fields[i].flags;
  return res;
}

Execute.prototype.readField = function(packet, connection) {
  var def = new Packets.ColumnDefinition(packet);
  this.fields.push(def);

  // TODO: api to allow to flag "I'm not going to change schema for this statement"
  // this way we can ignore column definitions in binary response and use
  // definition from prepare phase. Note that it's what happens currently
  // e.i if you do execute("select * from foo") and later add/remove/rename rows to foo
  // (without reconnecting) you are in trouble

  if (this.fields.length == this.fieldCount) {
    // compile row parser
    var parserKey = getFieldsKey(this.fields);
    // try cached first
    this.statementInfo.fields = this.fields;
    this.statementInfo.parser = connection.binaryProtocolParsers[parserKey];
    if (!this.statementInfo.parser) {
      this.statementInfo.parser = compileParser(this.fields);
      connection.binaryProtocolParsers[parserKey] = this.statementInfo.parser;
    }
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
  connection.sequenceId = 0;
  var executePacket = new Packets.Execute(this.statementInfo.id, this.parameters);
  connection.writePacket(executePacket.toPacket(1));
  return Execute.prototype.resultesetHeader;
};

Execute.prototype.resultesetHeader = function(packet) {
  var header = new Packets.ResultSetHeader(packet);
  this.resultFieldCount = header.fieldCount;
  this.insertId = header.insertId;
  if (this.resultFieldCount === 0) {
    if (this.onResult)
      this.onResult(null, header, []);
    return null;
  }
  return Execute.prototype.readResultField;
};

Execute.prototype.readResultField = function(packet) {
  var def;
  if (this.statementInfo.parser) // ignore result fields definition, we are reusing fields from prepare response
    this.resultFields.push(null);
  else {
    def = new Packets.ColumnDefinition(packet);
    this.resultFields.push(def);
  }
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
      this.onResult(null, this.rows, this.statementInfo.fields);
    return null;
  }

  var r = new this.statementInfo.parser(packet);
  if (this.onResult)
    this.rows.push(r);
  else
    this.emit('result', r);
  return Execute.prototype.row;
};

module.exports = Execute;
