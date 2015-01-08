var util    = require('util');

var Command  = require('./command.js');
var Packets  = require('../packets/index.js');

var compileParser = require('../compile_binary_parser.js');

function Execute(options, callback)
{
  Command.call(this);
  this.statement = options.statement;

  this.onResult = callback;
  this.parameters = options.values;

  this.resultFields = [];
  this.resultFieldCount = 0;
  this.insertId = 0;

  this.rows   = [];
  this.options = options;
}
util.inherits(Execute, Command);

Execute.prototype.buildParserFromFields = function(fields, connection) {
  var parserKey;
  if (!this.statement.parser) {
    // compile row parser
    parserKey = connection.keyFromFields(fields, this.options);
    this.statement.parser = connection.binaryProtocolParsers[parserKey];
    if (!this.statement.parser) {
      this.statement.parser = compileParser(fields, this.options, connection.config);
      connection.binaryProtocolParsers[parserKey] = this.statement.parser;
    }
  }
}

function statementKey(query, options) {
  return (typeof options.nestTables) +
    '/' + options.nestTables + '/' + options.rowsAsHash
        + query;
}

Execute.prototype.start = function(packet, connection) {
  var cachedStatement = connection._statements[statementKey(this.query, this.options)];
  var executePacket = new Packets.Execute(this.statement.id, this.parameters);
  connection.writePacket(executePacket.toPacket(1));
  return Execute.prototype.resultsetHeader;
};

Execute.prototype.resultsetHeader = function(packet) {
  var self = this;
  var header = new Packets.ResultSetHeader(packet);
  this.resultFieldCount = header.fieldCount;
  // we'll re-create row parser if schema reported by
  // prepare is different from one in result set
  if (this.statement.columns.length != this.resultFieldCount)
    this.statement.parser = null;
  this.insertId = header.insertId;
  if (this.resultFieldCount === 0) {
    if (this.onResult)
      process.nextTick(function() {
        self.onResult(null, header, []);
      });
    return null;
  }
  return Execute.prototype.readResultField;
};

Execute.prototype.readResultField = function(packet, connection) {
  var def;

  // TODO: this used to be performance optimisation (don't parse column def if we
  // already have one in statement info, but since we can't 100% trust statement info
  // column defs it's probably bettery to always use fields from result header.
  // config option to ignore this?

  // ignore result fields definition, we are reusing fields from prepare response
  if (this.statement.parser)
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

Execute.prototype.resultFieldsEOF = function(packet, connection) {
  // check EOF
  if (!packet.isEOF())
    return connection.protocolError("Expected EOF packet");

  if (!this.statement.parser)
    this.buildParserFromFields(this.resultFields, connection)
  return Execute.prototype.row;
};

Execute.prototype.row = function(packet, connection)
{
  var self = this;
  // TODO: refactor to share code with Query::row
  if (packet.isEOF()) {

    // TODO: multiple statements
    //packet.eofStatusFlags() & ServerStatus.SERVER_MORE_RESULTS_EXISTS;

    if (this.onResult)
      process.nextTick(function() {
        self.onResult(null, self.rows, self.resultFields);
      })
    return null;
  }

  var r = new this.statement.parser(packet);
  if (this.onResult)
    this.rows.push(r);
  else
    this.emit('result', r);
  return Execute.prototype.row;
};

module.exports = Execute;
