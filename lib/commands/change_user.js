'use strict';

const Command = require('./command.js');
const Packets = require('../packets/index.js');
const ClientHandshake = require('./client_handshake.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');

class ChangeUser extends Command {
  constructor(options, callback) {
    super();
    this.onResult = callback;
    this.user = options.user;
    this.password = options.password;
    this.database = options.database;
    this.passwordSha1 = options.passwordSha1;
    this.charsetNumber = options.charsetNumber;
    this.currentConfig = options.currentConfig;
  }
  start(packet, connection) {
    const newPacket = new Packets.ChangeUser({
      flags: connection.config.clientFlags,
      user: this.user,
      database: this.database,
      charsetNumber: this.charsetNumber,
      password: this.password,
      passwordSha1: this.passwordSha1,
      authPluginData1: connection._handshakePacket.authPluginData1,
      authPluginData2: connection._handshakePacket.authPluginData2
    });
    this.currentConfig.user = this.user;
    this.currentConfig.password = this.password;
    this.currentConfig.database = this.database;
    this.currentConfig.charsetNumber = this.charsetNumber;
    connection.clientEncoding = CharsetToEncoding[this.charsetNumber];
    // reset prepared statements cache as all statements become invalid after changeUser
    connection._statements.reset();
    connection.writePacket(newPacket.toPacket());
    return ChangeUser.prototype.handshakeResult;
  }
}

ChangeUser.prototype.handshakeResult =
  ClientHandshake.prototype.handshakeResult;
ChangeUser.prototype.calculateNativePasswordAuthToken =
  ClientHandshake.prototype.calculateNativePasswordAuthToken;

module.exports = ChangeUser;
