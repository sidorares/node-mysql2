'use strict';

const Packet = require('../packets/packet');
const StringParser = require('../parsers/string');
const CharsetToEncoding = require('../constants/charset_encodings.js');

const fields = ['catalog', 'schema', 'table', 'orgTable', 'name', 'orgName'];

// creating JS string is relatively expensive (compared to
// reading few bytes from buffer) because all string properties
// except for name are unlikely to be used we postpone
// string conversion until property access
//
// TODO: watch for integration benchmarks (one with real network buffer)
// there could be bad side effect as keeping reference to a buffer makes it
// sit in the memory longer (usually until final .query() callback)
// Latest v8 perform much better in regard to bufferer -> string conversion,
// at some point of time this optimisation might become unnecessary
// see https://github.com/sidorares/node-mysql2/pull/137
//
class ColumnDefinition {
  constructor(packet, clientEncoding) {
    this._buf = packet.buffer;
    this._clientEncoding = clientEncoding;
    this._catalogLength = packet.readLengthCodedNumber();
    this._catalogStart = packet.offset;
    packet.offset += this._catalogLength;
    this._schemaLength = packet.readLengthCodedNumber();
    this._schemaStart = packet.offset;
    packet.offset += this._schemaLength;
    this._tableLength = packet.readLengthCodedNumber();
    this._tableStart = packet.offset;
    packet.offset += this._tableLength;
    this._orgTableLength = packet.readLengthCodedNumber();
    this._orgTableStart = packet.offset;
    packet.offset += this._orgTableLength;
    // name is always used, don't make it lazy
    const _nameLength = packet.readLengthCodedNumber();
    const _nameStart = packet.offset;
    packet.offset += _nameLength;
    this._orgNameLength = packet.readLengthCodedNumber();
    this._orgNameStart = packet.offset;
    packet.offset += this._orgNameLength;
    packet.skip(1); //  length of the following fields (always 0x0c)
    this.characterSet = packet.readInt16();
    this.encoding = CharsetToEncoding[this.characterSet];
    this.name = StringParser.decode(
      this._buf.slice(_nameStart, _nameStart + _nameLength),
      this.encoding === 'binary' ? this._clientEncoding : this.encoding
    );
    this.columnLength = packet.readInt32();
    this.columnType = packet.readInt8();
    this.flags = packet.readInt16();
    this.decimals = packet.readInt8();
  }

  inspect() {
    return {
      catalog: this.catalog,
      schema: this.schema,
      name: this.name,
      orgName: this.orgName,
      table: this.table,
      orgTable: this.orgTable,
      characterSet: this.characterSet,
      columnLength: this.columnLength,
      columnType: this.columnType,
      flags: this.flags,
      decimals: this.decimals
    };
  }

  static toPacket(column, sequenceId) {
    let length = 17; // = 4 padding + 1 + 12 for the rest
    fields.forEach(field => {
      length += Packet.lengthCodedStringLength(
        column[field],
        CharsetToEncoding[column.characterSet]
      );
    });
    const buffer = Buffer.allocUnsafe(length);

    const packet = new Packet(sequenceId, buffer, 0, length);
    function writeField(name) {
      packet.writeLengthCodedString(
        column[name],
        CharsetToEncoding[column.characterSet]
      );
    }
    packet.offset = 4;
    fields.forEach(writeField);
    packet.writeInt8(0x0c);
    packet.writeInt16(column.characterSet);
    packet.writeInt32(column.columnLength);
    packet.writeInt8(column.columnType);
    packet.writeInt16(column.flags);
    packet.writeInt8(column.decimals);
    packet.writeInt16(0); // filler
    return packet;
  }

  // node-mysql compatibility: alias "db" to "schema"
  get db() {
    const start = this._schemaStart;
    const end = start._shemaLength;
    return this._buf.utf8Slice(start, end);
  }
}

const addString = function(name) {
  Object.defineProperty(ColumnDefinition.prototype, name, {
    get: function() {
      const start = this['_' + name + 'Start'];
      const end = start + this['_' + name + 'Length'];
      return StringParser.decode(
        this._buf.slice(start, end),
        this.encoding === 'binary' ? this._clientEncoding : this.encoding
      );
    }
  });
};

addString('catalog');
addString('schema');
addString('table');
addString('orgTable');
addString('orgName');

module.exports = ColumnDefinition;
