var Packet = require('../packets/packet');

// creating JS string is relatively expencive (compared to
// reading few bytes from buffer) because all string properties
// except for name are unlikely to be used we postpone
// string conversion until property access
//
// TODO: watch for integration benchmarks (one with real network buffer)
// there could be bad side effect as keeping reference to a buffer makes it
// sit in the memory longer (usually until final .query() callback)
// Latest v8 perform much better in regard to bufferer -> string convertion,
// at some point of time this optimisation might become unnecessary
// see https://github.com/sidorares/node-mysql2/pull/137
//
function ColumnDefinition(packet)
{
  this._buf     = packet.buffer;

  this._catalogLength = packet.readLengthCodedNumber();
  this._catalogStart  = packet.offset;
  packet.offset += this._catalogLength;

  this._schemaLength = packet.readLengthCodedNumber();
  this._schemaStart  = packet.offset;
  packet.offset += this._schemaLength;

  this._tableLength = packet.readLengthCodedNumber();
  this._tableStart  = packet.offset;
  packet.offset += this._tableLength;

  this._orgTableLength = packet.readLengthCodedNumber();
  this._orgTableStart  = packet.offset;
  packet.offset += this._orgTableLength;

  // name is always used, don't make it lazy
  this.name     = packet.readLengthCodedString();

  this._orgNameLength = packet.readLengthCodedNumber();
  this._orgNameStart  = packet.offset;
  packet.offset += this._orgNameLength;

  packet.skip(1); //  length of the following fields (always 0x0c)
  this.characterSet = packet.readInt16();
  this.columnLength = packet.readInt32();
  this.columnType   = packet.readInt8();
  this.flags        = packet.readInt16();
  this.decimals     = packet.readInt8();
}

var addString = function(name) {
  Object.defineProperty(ColumnDefinition.prototype, name, { get: function() {
    var start = this['_' + name + 'Start'];
    var end = start + this['_' + name + 'Length'];
    return this._buf.utf8Slice(start, end);
  }});
};

addString('catalog');
addString('schema');
addString('table');
addString('orgTable');
addString('orgName');

ColumnDefinition.prototype.inspect = function() {
  return {
    catalog      : this.catalog,
    schema      : this.schema,
    name        : this.name,
    orgName     : this.orgName,
    table       : this.table,
    orgTable    : this.orgTable,
    characterSet: this.characterSet,
    columnLength: this.columnLength,
    columnType  : this.columnType,
    flags       : this.flags,
    decimals    : this.decimals
  };
};

ColumnDefinition.toPacket = function(column, sequenceId)
{
  var length = 0;
  var fields = 'catalog schema table orgTable name orgName'.split(' ');
  function addFieldLength(name) {
    var str = column[name];
    length +=Packet.lengthCodedNumberLength(str);
    length += str.length;
  }
  fields.forEach(addFieldLength);
  length += 13;
  var buffer = new Buffer(length);
  for (var i=0; i < length; ++i)
    buffer[i] = 0;

  function writeField(name) {
    packet.writeLengthCodedString(column[name]);
  }
  var packet = new Packet(sequenceId, buffer, 0, length);
  packet.offset = 4;
  fields.forEach(writeField);
  packet.writeInt8 (0x0c);
  packet.writeInt16(column.characterSet);
  packet.writeInt32(column.columnLength);
  packet.writeInt8 (column.columnType);
  packet.writeInt16(column.flags);
  packet.writeInt8 (column.decimals);
  return packet;
};

module.exports = ColumnDefinition;
