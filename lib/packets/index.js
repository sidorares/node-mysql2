'auth_switch_request auth_switch_response auth_switch_request_more_data binlog_dump register_slave ssl_request handshake handshake_response query resultset_header column_definition text_row binary_row prepare_statement close_statement prepared_statement_header execute change_user'
  .split(' ')
  .forEach(function(name) {
    var ctor = require('./' + name + '.js');
    module.exports[ctor.name] = ctor;
    // monkey-patch it to include name if debug is on
    if (process.env.NODE_DEBUG) {
      if (ctor.prototype.toPacket) {
        var old = ctor.prototype.toPacket;
        ctor.prototype.toPacket = function() {
          var p = old.call(this);
          p._name = ctor.name;
          return p;
        };
      }
    }
  });

var Buffer = require('safe-buffer').Buffer;

// simple packets:
var Packet = require('./packet');
module.exports.Packet = Packet;

module.exports.OK = function OK() {};

module.exports.OK.toPacket = function(args, encoding) {
  args = args || {};
  var affectedRows = args.affectedRows || 0;
  var insertId = args.insertId || 0;
  var serverStatus = args.serverStatus || 0;
  var warningCount = args.warningCount || 0;
  var message = args.message || '';

  var length = 9 + Packet.lengthCodedNumberLength(affectedRows);
  length += Packet.lengthCodedNumberLength(insertId);

  var buffer = Buffer.allocUnsafe(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(0);
  packet.writeLengthCodedNumber(affectedRows);
  packet.writeLengthCodedNumber(insertId);
  packet.writeInt16(serverStatus);
  packet.writeInt16(warningCount);
  packet.writeString(message, encoding);
  packet._name = 'OK';
  return packet;
};

// warnings, statusFlags
module.exports.EOF = function EOF() {};

module.exports.EOF.toPacket = function(warnings, statusFlags) {
  if (typeof warnings == 'undefined') {
    warnings = 0;
  }
  if (typeof statusFlags == 'undefined') {
    statusFlags = 0;
  }
  var packet = new Packet(0, Buffer.allocUnsafe(9), 0, 9);
  packet.offset = 4;
  packet.writeInt8(0xfe);
  packet.writeInt16(warnings);
  packet.writeInt16(statusFlags);
  packet._name = 'EOF';
  return packet;
};

module.exports.Error = function Error() {};

module.exports.Error.toPacket = function(args, encoding) {
  var length = 13 + Buffer.byteLength(args.message, 'utf8');
  var packet = new Packet(0, Buffer.allocUnsafe(length), 0, length);
  packet.offset = 4;
  packet.writeInt8(0xff);
  packet.writeInt16(args.code);
  // TODO: sql state parameter
  packet.writeString('#_____', encoding);
  packet.writeString(args.message, encoding);
  packet._name = 'Error';
  return packet;
};
