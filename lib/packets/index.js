'use strict';

'auth_switch_request auth_switch_response auth_switch_request_more_data binlog_dump register_slave ssl_request handshake handshake_response query resultset_header column_definition text_row binary_row prepare_statement close_statement prepared_statement_header execute change_user'
  .split(' ')
  .forEach(name => {
    const ctor = require('./' + name + '.js');
    module.exports[ctor.name] = ctor;
    // monkey-patch it to include name if debug is on
    if (process.env.NODE_DEBUG) {
      if (ctor.prototype.toPacket) {
        const old = ctor.prototype.toPacket;
        ctor.prototype.toPacket = function() {
          const p = old.call(this);
          p._name = ctor.name;
          return p;
        };
      }
    }
  });

// simple packets:
const Packet = require('./packet');
exports.Packet = Packet;

class OK {
  static toPacket(args, encoding) {
    args = args || {};
    const affectedRows = args.affectedRows || 0;
    const insertId = args.insertId || 0;
    const serverStatus = args.serverStatus || 0;
    const warningCount = args.warningCount || 0;
    const message = args.message || '';

    let length = 9 + Packet.lengthCodedNumberLength(affectedRows);
    length += Packet.lengthCodedNumberLength(insertId);

    const buffer = Buffer.allocUnsafe(length);
    const packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeInt8(0);
    packet.writeLengthCodedNumber(affectedRows);
    packet.writeLengthCodedNumber(insertId);
    packet.writeInt16(serverStatus);
    packet.writeInt16(warningCount);
    packet.writeString(message, encoding);
    packet._name = 'OK';
    return packet;
  }
}

exports.OK = OK;

// warnings, statusFlags
class EOF {
  static toPacket(warnings, statusFlags) {
    if (typeof warnings == 'undefined') {
      warnings = 0;
    }
    if (typeof statusFlags == 'undefined') {
      statusFlags = 0;
    }
    const packet = new Packet(0, Buffer.allocUnsafe(9), 0, 9);
    packet.offset = 4;
    packet.writeInt8(0xfe);
    packet.writeInt16(warnings);
    packet.writeInt16(statusFlags);
    packet._name = 'EOF';
    return packet;
  }
}

exports.EOF = EOF;

class Error {
  static toPacket(args, encoding) {
    const length = 13 + Buffer.byteLength(args.message, 'utf8');
    const packet = new Packet(0, Buffer.allocUnsafe(length), 0, length);
    packet.offset = 4;
    packet.writeInt8(0xff);
    packet.writeInt16(args.code);
    // TODO: sql state parameter
    packet.writeString('#_____', encoding);
    packet.writeString(args.message, encoding);
    packet._name = 'Error';
    return packet;
  }
}

exports.Error = Error;
