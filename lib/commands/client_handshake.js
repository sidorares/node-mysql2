'use strict';

const Command = require('./command.js');
const Packets = require('../packets/index.js');
const ClientConstants = require('../constants/client.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');

// TODO: refactor to use plugins
// need to coordinate with ChangeUser command,
// currently it uses sync calculateNativePasswordAuthToken method from here
const auth41 = require('../auth_41.js');

const caching_sha2_password = require('../auth_plugins/caching_sha2_password.js');
const mysql_native_password = require('../auth_plugins/mysql_native_password.js');

const standardAuthPlugins = {
  caching_sha2_password: caching_sha2_password({}),
  mysql_native_password: mysql_native_password({})
};

function flagNames(flags) {
  const res = [];
  for (const c in ClientConstants) {
    if (flags & ClientConstants[c]) {
      res.push(c.replace(/_/g, ' ').toLowerCase());
    }
  }
  return res;
}

class ClientHandshake extends Command {
  constructor({ clientFlags }) {
    super();
    this.handshake = null;
    this.clientFlags = clientFlags;
  }

  start() {
    return ClientHandshake.prototype.handshakeInit;
  }

  sendSSLRequest(connection) {
    const sslRequest = new Packets.SSLRequest(
      this.clientFlags,
      connection.config.charsetNumber
    );
    connection.writePacket(sslRequest.toPacket());
  }

  sendCredentials(connection) {
    if (connection.config.debug) {
      // eslint-disable-next-line
      console.log(
        'Sending handshake packet: flags:%d=(%s)',
        this.clientFlags,
        flagNames(this.clientFlags).join(', ')
      );
    }
    this.user = connection.config.user;
    this.password = connection.config.password;
    this.passwordSha1 = connection.config.passwordSha1;
    this.database = connection.config.database;
    this.authPluginName = this.handshake.authPluginName;
    this.authPluginData1 = this.handshake.authPluginData1;
    this.authPluginData2 = this.handshake.authPluginData2;

    // TODO: pre-4.1 auth support
    this.password = this.handshake.password || '';
    this.passwordSha1 = this.handshake.passwordSha1;

    let authPlugin =
      connection.config.authPlugins &&
      connection.config.authPlugins[this.authPluginName];

    if (!authPlugin) {
      authPlugin = standardAuthPlugins[this.authPluginName];
    }

    if (!authPlugin) {
      this.emit(
        'error',
        new Error(`Unknown auth plugin name: ${this.authPluginName}`)
      );
      return;
    }

    const pluginData = Buffer.concat([
      this.authPluginData1,
      this.authPluginData2
    ]);
    const authTokenPromise = Promise.resolve(
      authPlugin({ connection, command: this })(pluginData)
    );
    authTokenPromise
      .then(authToken => {
        if (!Buffer.isBuffer(authToken)) {
          this.emit(
            'error',
            new Error(
              `Error calculating auth token. Auth plugin ${this.authPluginName} must return Buffer.`
            )
          );
          return;
        }
        const handshakeResponse = new Packets.HandshakeResponse({
          flags: this.clientFlags,
          user: this.user,
          database: this.database,
          authToken,
          charsetNumber: connection.config.charsetNumber,
          compress: connection.config.compress,
          connectAttributes: connection.config.connectAttributes
        });
        connection.writePacket(handshakeResponse.toPacket());
      })
      .catch(error => {
        this.emit('error', error);
      });
  }

  calculateNativePasswordAuthToken(authPluginData) {
    // TODO: dont split into authPluginData1 and authPluginData2, instead join when 1 & 2 received
    const authPluginData1 = authPluginData.slice(0, 8);
    const authPluginData2 = authPluginData.slice(8, 20);
    let authToken;
    if (this.passwordSha1) {
      authToken = auth41.calculateTokenFromPasswordSha(
        this.passwordSha1,
        authPluginData1,
        authPluginData2
      );
    } else {
      authToken = auth41.calculateToken(
        this.password,
        authPluginData1,
        authPluginData2
      );
    }
    return authToken;
  }

  handshakeInit(helloPacket, connection) {
    this.on('error', e => {
      connection._fatalError = e;
      connection._protocolError = e;
    });
    this.handshake = Packets.Handshake.fromPacket(helloPacket);
    if (connection.config.debug) {
      // eslint-disable-next-line
      console.log(
        'Server hello packet: capability flags:%d=(%s)',
        this.handshake.capabilityFlags,
        flagNames(this.handshake.capabilityFlags).join(', ')
      );
    }
    connection.serverCapabilityFlags = this.handshake.capabilityFlags;
    connection.serverEncoding = CharsetToEncoding[this.handshake.characterSet];
    connection.connectionId = this.handshake.connectionId;
    const serverSSLSupport =
      this.handshake.capabilityFlags & ClientConstants.SSL;
    // use compression only if requested by client and supported by server
    connection.config.compress =
      connection.config.compress &&
      this.handshake.capabilityFlags & ClientConstants.COMPRESS;
    this.clientFlags = this.clientFlags | connection.config.compress;
    if (connection.config.ssl) {
      // client requires SSL but server does not support it
      if (!serverSSLSupport) {
        const err = new Error('Server does not support secure connnection');
        err.code = 'HANDSHAKE_NO_SSL_SUPPORT';
        err.fatal = true;
        this.emit('error', err);
        return false;
      }
      // send ssl upgrade request and immediately upgrade connection to secure
      this.clientFlags |= ClientConstants.SSL;
      this.sendSSLRequest(connection);
      connection.startTLS(err => {
        // after connection is secure
        if (err) {
          // SSL negotiation error are fatal
          err.code = 'HANDSHAKE_SSL_ERROR';
          err.fatal = true;
          this.emit('error', err);
          return;
        }
        // rest of communication is encrypted
        this.sendCredentials(connection);
      });
    } else {
      this.sendCredentials(connection);
    }
    return ClientHandshake.prototype.handshakeResult;
  }

  handshakeResult(packet, connection) {
    const marker = packet.peekByte();
    if (marker === 0xfe || marker === 1) {
      const authSwitch = require('./auth_switch');
      try {
        if (marker === 1) {
          authSwitch.authSwitchRequestMoreData(packet, connection, this);
        } else {
          authSwitch.authSwitchRequest(packet, connection, this);
        }
        return ClientHandshake.prototype.handshakeResult;
      } catch (err) {
        if (this.onResult) {
          this.onResult(err);
        } else {
          connection.emit('error', err);
        }
        return null;
      }
    }
    if (marker !== 0) {
      const err = new Error('Unexpected packet during handshake phase');
      if (this.onResult) {
        this.onResult(err);
      } else {
        connection.emit('error', err);
      }
      return null;
    }
    // this should be called from ClientHandshake command only
    // and skipped when called from ChangeUser command
    if (!connection.authorized) {
      connection.authorized = true;
      if (connection.config.compress) {
        const enableCompression = require('../compressed_protocol.js')
          .enableCompression;
        enableCompression(connection);
      }
    }
    if (this.onResult) {
      this.onResult(null);
    }
    return null;
  }
}
module.exports = ClientHandshake;
