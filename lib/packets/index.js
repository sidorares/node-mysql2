'use strict';

const process = require('process');

const AuthSwitchRequest = require('./auth_switch_request');
const AuthSwitchRequestMoreData = require('./auth_switch_request_more_data');
const AuthSwitchResponse = require('./auth_switch_response');
const BinaryRow = require('./binary_row');
const BinlogDump = require('./binlog_dump');
const ChangeUser = require('./change_user');
const CloseStatement = require('./close_statement');
const ColumnDefinition = require('./column_definition');
const Execute = require('./execute');
const Handshake = require('./handshake');
const HandshakeResponse = require('./handshake_response');
const PrepareStatement = require('./prepare_statement');
const PreparedStatementHeader = require('./prepared_statement_header');
const Query = require('./query');
const RegisterSlave = require('./register_slave');
const ResultSetHeader = require('./resultset_header');
const SSLRequest = require('./ssl_request');
const TextRow = require('./text_row');

const ctorMap = {
  AuthSwitchRequest,
  AuthSwitchRequestMoreData,
  AuthSwitchResponse,
  BinaryRow,
  BinlogDump,
  ChangeUser,
  CloseStatement,
  ColumnDefinition,
  Execute,
  Handshake,
  HandshakeResponse,
  PrepareStatement,
  PreparedStatementHeader,
  Query,
  RegisterSlave,
  ResultSetHeader,
  SSLRequest,
  TextRow
};
Object.entries(ctorMap).forEach(([name, ctor]) => {
  module.exports[name] = ctor;
  // monkey-patch it to include name if debug is on
  if (process.env.NODE_DEBUG) {
    if (ctor.prototype.toPacket) {
      const old = ctor.prototype.toPacket;
      ctor.prototype.toPacket = function() {
        const p = old.call(this);
        p._name = name;
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
    if (typeof warnings === 'undefined') {
      warnings = 0;
    }
    if (typeof statusFlags === 'undefined') {
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
