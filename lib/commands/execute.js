var util = require('util');

var Command = require('./command.js');
var Query = require('./query.js');
var Packets = require('../packets/index.js');

var objectAssign = require('object-assign');

var compileParser = require('../compile_binary_parser.js');

function Execute (options, callback)
{
  Command.call(this);
  this.statement = options.statement;
  this.sql = options.sql;
  this.values = options.values;
  this.onResult = callback;
  this.parameters = options.values;

  this.insertId = 0;

  this._rows = [];
  this._fields = [];
  this._result = [];
  this._fieldCount = 0;
  this._rowParser = null;
  this._executeOptions = options;
  this._resultIndex = 0;
  this._localStream = null;
  this._streamFactory = options.infileStreamFactory;
}
util.inherits(Execute, Command);

Execute.prototype.buildParserFromFields = function (fields, connection) {
  var parserKey = connection.keyFromFields(fields, this.options);
  var parser = connection.binaryProtocolParsers[parserKey];
  if (!parser) {
    parser = compileParser(fields, this.options, connection.config);
    connection.binaryProtocolParsers[parserKey] = parser;
  }
  return parser;
};

Execute.prototype.start = function (packet, connection) {
  this.options = objectAssign({}, connection.config, this._executeOptions);
  var executePacket = new Packets.Execute(this.statement.id, this.parameters, connection.config.charsetNumber);
  connection.writePacket(executePacket.toPacket(1));
  return Execute.prototype.resultsetHeader;
};

Execute.prototype.done = Query.prototype.done;
Execute.prototype.doneInsert = Query.prototype.doneInsert;
Execute.prototype.resultsetHeader = Query.prototype.resultsetHeader;
Execute.prototype._findOrCreateReadStream = Query.prototype._findOrCreateReadStream;
Execute.prototype._streamLocalInfile = Query.prototype._streamLocalInfile;
Execute.prototype.row = Query.prototype.row;
Execute.prototype.stream = Query.prototype.stream;

Execute.prototype.readField = function (packet, connection) {
  var def, fields;

  // disabling for now, but would be great to find reliable way to parse fields only once
  // fields reported by prepare can be empty at all or just incorrect - see #169
  //
  // perfomance optimisation: if we already have this field parsed in statement header, use one from header
  // var field = this.statement.columns.length == this._fieldCount ?
  //  this.statement.columns[this._receivedFieldsCount] : new Packets.ColumnDefinition(packet);

  var field = new Packets.ColumnDefinition(packet);

  this._receivedFieldsCount++;
  this._fields[this._resultIndex].push(field);
  if (this._receivedFieldsCount == this._fieldCount) {
    fields = this._fields[this._resultIndex];
    this.emit('fields', fields, this._resultIndex);
    return Execute.prototype.fieldsEOF;
  }
  return Execute.prototype.readField;
};

Execute.prototype.fieldsEOF = function (packet, connection) {
  // check EOF
  if (!packet.isEOF()) {
    return connection.protocolError('Expected EOF packet');
  }
  this._rowParser = this.buildParserFromFields(this._fields[this._resultIndex], connection);
  return Execute.prototype.row;
};

module.exports = Execute;
