"binlog_dump register_slave ssl_request handshake handshake_response query resultset_header column_definition text_row binary_row prepare_statement prepared_statement_header execute".split(' ').forEach(function(name) {
  var ctor = require('./' + name);
  module.exports[ctor.name] = ctor;
  // monkey-patch it to include name if debug is on
  if (process.env.NODE_DEBUG) {
    if (ctor.prototype.toPacket) {
      var old = ctor.prototype.toPacket;
      ctor.prototype.toPacket = function() {
        var p = old.call(this);
        p._name = ctor.name;
        return p;
      }
    }
  }
});

// simple packets:
var Packet = require('./packet');

module.exports.OK = function OK() {
};

module.exports.OK.toPacket = function(args) {
  var length = 5 + Packet.lengthCodedNumberLength(args.affectedRows);
  if (args.insertId)
    length += Packet.lengthCodedNumberLength(args.insertId);
  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer);
  packet.offset = 4;
  packet.writeInt8(0);
  packet.writeLengthCodedNumber(args.affectedRows);
  if (args.insertId)
    packet.writeLengthCodedNumber(args.insertId);
  packet._name = "OK";
  return packet;
};

// warnings, statusFlags
module.exports.EOF = function EOF() {
};

module.exports.EOF.toPacket = function(warnings, statusFlags) {
  if (typeof warnings == 'undefined')
    warnings = 0;
  if (typeof statusFlags == 'undefined')
    statusFlags = 0;
  var packet = new Packet(0, new Buffer(9));
  packet.offset = 4;
  packet.writeInt8(0xfe);
  packet.writeInt16(warnings);
  packet.writeInt16(statusFlags);
  packet._name = "EOF";
  return packet;
};

module.exports.Error = function Error() {
};

module.exports.Error.toPacket = function(args) {
  var packet = new Packet(0, new Buffer(13 + Buffer.byteLength(args.message, 'utf8')));
  packet.offset = 4;
  packet.writeInt8(0xff);
  packet.writeInt16(args.code);
  packet.writeString('#_____');
  packet.writeString(args.message);
  packet._name = "Error";
  return packet;
};
