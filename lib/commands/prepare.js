var util = require('util');

var Packets = require('../packets/index.js');
var Command = require('./command.js');
var CloseStatement = require('./close_statement.js');
var Execute = require('./execute.js');

function Prepare (options, callback)
{
  Command.call(this);
  this.query = options.sql;
  this.onResult = callback;

  this.id = 0;
  this.fieldCount = 0;
  this.parameterCount = 0;
  this.fields = [];
  this.parameterDefinitions = [];
  this.options = options;
}
util.inherits(Prepare, Command);

Prepare.prototype.start = function (packet, connection) {
  var Connection = connection.constructor;
  this.key = Connection.statementKey(this.options);

  var statement = connection._statements.get(this.key);
  if (statement) {
    if (this.onResult) {
      this.onResult(null, statement);
    }
    return null;
  }

  var cmdPacket = new Packets.PrepareStatement(this.query, connection.config.charsetNumber);
  connection.writePacket(cmdPacket.toPacket(1));
  return Prepare.prototype.prepareHeader;
};

function PreparedStatementInfo (query, id, columns, parameters, connection) {
  this.query = query;
  this.id = id;
  this.columns = columns;
  this.parameters = parameters;
  this.rowParser = null;
  this._connection = connection;
}

PreparedStatementInfo.prototype.close = function () {
  return this._connection.addCommand(new CloseStatement(this.id));
};

PreparedStatementInfo.prototype.execute = function (parameters, callback) {
  if (typeof parameters == 'function') {
    callback = parameters;
    parameters = [];
  }
  return this._connection.addCommand(new Execute({statement: this, values: parameters}, callback));
};

Prepare.prototype.prepareHeader = function (packet, connection) {
  var header = new Packets.PreparedStatementHeader(packet);
  this.id = header.id;
  this.fieldCount = header.fieldCount;
  this.parameterCount = header.parameterCount;
  if (this.parameterCount > 0) {
    return Prepare.prototype.readParameter;
  } else if (this.fieldCount > 0) {
    return Prepare.prototype.readField;
  } else {
    return this.prepareDone(connection);
  }
};

Prepare.prototype.readParameter = function (packet) {
  var def = new Packets.ColumnDefinition(packet);
  this.parameterDefinitions.push(def);
  if (this.parameterDefinitions.length == this.parameterCount) {
    return Prepare.prototype.parametersEOF;
  }
  return this.readParameter;
};

Prepare.prototype.readField = function (packet, connection) {
  var def = new Packets.ColumnDefinition(packet);
  this.fields.push(def);
  if (this.fields.length == this.fieldCount) {
    return Prepare.prototype.fieldsEOF;
  }
  return Prepare.prototype.readField;
};

Prepare.prototype.parametersEOF = function (packet, connection) {
  if (!packet.isEOF()) {
    return connection.protocolError('Expected EOF packet after parameters');
  }

  if (this.fieldCount > 0) {
    return Prepare.prototype.readField;
  } else {
    return this.prepareDone(connection);
  }
};

Prepare.prototype.fieldsEOF = function (packet, connection) {
  if (!packet.isEOF()) {
    return connection.protocolError('Expected EOF packet after fields');
  }
  return this.prepareDone(connection);
};

Prepare.prototype.prepareDone = function (connection)
{
  var self = this;
  var statement = new PreparedStatementInfo(
    self.query,
    self.id,
    self.fields,
    self.parameterDefinitions,
    connection
  );

  connection._statements.set(this.key, statement);

  if (this.onResult) {
    self.onResult(null, statement);
  }
  return null;
};

module.exports = Prepare;
