// This file was modified by Oracle on June 17, 2021.
// Handshake errors are now maked as fatal and the corresponding events are
// emitted in the command instance itself.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

// This file was modified by Oracle on September 21, 2021.
// Handshake workflow now supports additional authentication factors requested
// by the server.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

const Command = require('./command.js');
const Packets = require('../packets/index.js');
const ClientConstants = require('../constants/client.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');
const auth41 = require('../auth_41.js');
const { getAuthPlugin } = require('./auth_switch.js');
const {
  calculateToken: calculateSha2Token,
} = require('../auth_plugins/caching_sha2_password.js');

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
  constructor(clientFlags) {
    super();
    this.handshake = null;
    this.clientFlags = clientFlags;
    this.authenticationFactor = 0;
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
      console.log(
        'Sending handshake packet: flags:%d=(%s)',
        this.clientFlags,
        flagNames(this.clientFlags).join(', ')
      );
    }
    this.user = connection.config.user;
    this.password = connection.config.password;
    // "password1" is an alias to the original "password" value
    // to make it easier to integrate multi-factor authentication
    this.password1 = connection.config.password;
    // "password2" and "password3" are the 2nd and 3rd factor authentication
    // passwords, which can be undefined depending on the authentication
    // plugin being used
    this.password2 = connection.config.password2;
    this.password3 = connection.config.password3;
    this.passwordSha1 = connection.config.passwordSha1;
    this.database = connection.config.database;
    this.authPluginName = this.handshake.authPluginName;

    // Optimization: Try to use the server's preferred authentication method
    // to avoid an unnecessary auth switch roundtrip
    const serverAuthMethod = this.handshake.authPluginName;
    const isSecureConnection =
      connection.config.ssl || connection.config.socketPath;

    // Combine auth plugin data for easier handling
    // Note: authPluginData2 can include a trailing NUL byte when PLUGIN_AUTH is set
    // We must ensure exactly 20 bytes for the scramble
    const authPluginData =
      this.handshake.authPluginData1 && this.handshake.authPluginData2
        ? Buffer.concat([
            this.handshake.authPluginData1,
            this.handshake.authPluginData2,
          ]).slice(0, 20)
        : Buffer.alloc(20);

    // Check if user has custom auth plugin or legacy handler for the server-advertised method
    // If so, we must not bypass the auth switch flow with our built-in implementation
    const hasCustomAuthPlugin =
      connection.config.authPlugins &&
      Object.prototype.hasOwnProperty.call(
        connection.config.authPlugins,
        serverAuthMethod
      );
    const hasLegacyAuthSwitchHandler =
      typeof connection.config.authSwitchHandler === 'function';

    // Determine which auth method to use
    // Try to use server's preferred method if we can, otherwise fallback to native
    const canUseDirectAuth =
      !hasCustomAuthPlugin &&
      !hasLegacyAuthSwitchHandler &&
      this.canUseAuthMethodDirectly(serverAuthMethod, isSecureConnection);

    const clientAuthMethod = canUseDirectAuth
      ? serverAuthMethod
      : 'mysql_native_password';

    // Calculate the auth token for the chosen method
    const authToken = this.calculateAuthToken(
      clientAuthMethod,
      this.password,
      authPluginData
    );

    if (connection.config.debug) {
      console.log(
        'Server auth method: %s, Using auth method: %s',
        serverAuthMethod,
        clientAuthMethod
      );
    }

    const handshakeResponse = new Packets.HandshakeResponse({
      flags: this.clientFlags,
      user: this.user,
      database: this.database,
      password: this.password,
      passwordSha1: this.passwordSha1,
      charsetNumber: connection.config.charsetNumber,
      authPluginData1: this.handshake.authPluginData1,
      authPluginData2: this.handshake.authPluginData2,
      compress: connection.config.compress,
      connectAttributes: connection.config.connectAttributes,
      authToken: authToken,
      authPluginName: clientAuthMethod,
    });
    connection.writePacket(handshakeResponse.toPacket());

    // If we used a non-native auth method in the initial handshake response,
    // we need to prepare for potential AuthMoreData packets by creating
    // the appropriate auth plugin instance
    if (clientAuthMethod !== 'mysql_native_password') {
      this.initializeAuthPlugin(clientAuthMethod, authPluginData, connection);
    }
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

  calculateSha256Token(password, scramble) {
    // Reuse the token calculation from caching_sha2_password plugin
    // to avoid code duplication and ensure consistency
    return calculateSha2Token(password, scramble);
  }

  // Helper: Calculate auth token for a specific auth method
  calculateAuthToken(authMethod, password, authPluginData) {
    switch (authMethod) {
      case 'mysql_native_password':
        return this.calculateNativePasswordAuthToken(authPluginData);

      case 'caching_sha2_password':
        return this.calculateSha256Token(password, authPluginData);

      case 'sha256_password':
      case 'mysql_clear_password':
        // These methods send plaintext password over secure connections
        return password
          ? Buffer.from(`${password}\0`, 'utf8')
          : Buffer.alloc(0);

      default:
        // Unknown method - use native password as fallback
        return this.calculateNativePasswordAuthToken(authPluginData);
    }
  }

  // Helper: Determine if we can use a specific auth method directly
  canUseAuthMethodDirectly(authMethod, isSecureConnection) {
    switch (authMethod) {
      case 'mysql_native_password':
      case 'caching_sha2_password':
        // These methods work with or without SSL
        return true;

      case 'sha256_password':
      case 'mysql_clear_password':
        // These methods require secure connection for direct use
        return isSecureConnection;

      default:
        // Unknown methods - fallback to native password
        return false;
    }
  }

  // Helper: Initialize auth plugin for handling subsequent AuthMoreData packets
  initializeAuthPlugin(authMethod, authPluginData, connection) {
    const authPlugin = getAuthPlugin(authMethod, connection);
    if (!authPlugin) {
      return; // Plugin not found, will fallback to auth switch if needed
    }

    // Initialize the plugin with connection and command context
    const pluginHandler = authPlugin({ connection, command: this });
    connection._authPlugin = pluginHandler;

    // Prime the plugin by calling it with the scramble data
    // This advances the plugin's state machine (e.g., to STATE_TOKEN_SENT)
    // We don't send the result because we already included it in the handshake response
    try {
      Promise.resolve(pluginHandler(authPluginData)).catch((err) => {
        // Ignore errors during initialization since we already sent the token
        if (connection.config.debug) {
          console.log('Auth plugin initialization:', err.message);
        }
      });
    } catch (err) {
      // Ignore synchronous errors during initialization
      if (connection.config.debug) {
        console.log('Auth plugin initialization error:', err.message);
      }
    }
  }

  handshakeInit(helloPacket, connection) {
    this.on('error', (e) => {
      connection._fatalError = e;
      connection._protocolError = e;
    });
    this.handshake = Packets.Handshake.fromPacket(helloPacket);
    if (connection.config.debug) {
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
    // multi factor authentication is enabled with the
    // "MULTI_FACTOR_AUTHENTICATION" capability and should only be used if it
    // is supported by the server
    const multiFactorAuthentication =
      this.handshake.capabilityFlags &
      ClientConstants.MULTI_FACTOR_AUTHENTICATION;
    this.clientFlags = this.clientFlags | multiFactorAuthentication;
    // use compression only if requested by client and supported by server
    connection.config.compress =
      connection.config.compress &&
      this.handshake.capabilityFlags & ClientConstants.COMPRESS;
    this.clientFlags = this.clientFlags | connection.config.compress;
    if (connection.config.ssl) {
      // client requires SSL but server does not support it
      if (!serverSSLSupport) {
        const err = new Error('Server does not support secure connection');
        err.code = 'HANDSHAKE_NO_SSL_SUPPORT';
        err.fatal = true;
        this.emit('error', err);
        return false;
      }
      // send ssl upgrade request and immediately upgrade connection to secure
      this.clientFlags |= ClientConstants.SSL;
      this.sendSSLRequest(connection);
      connection.startTLS((err) => {
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
    if (multiFactorAuthentication) {
      // if the server supports multi-factor authentication, we enable it in
      // the client
      this.authenticationFactor = 1;
    }
    return ClientHandshake.prototype.handshakeResult;
  }

  handshakeResult(packet, connection) {
    const marker = packet.peekByte();
    // packet can be OK_Packet, ERR_Packet, AuthSwitchRequest, AuthNextFactor
    // or AuthMoreData
    if (marker === 0xfe || marker === 1 || marker === 0x02) {
      const authSwitch = require('./auth_switch');
      try {
        if (marker === 1) {
          authSwitch.authSwitchRequestMoreData(packet, connection, this);
        } else {
          // if authenticationFactor === 0, it means the server does not support
          // the multi-factor authentication capability
          if (this.authenticationFactor !== 0) {
            // if we are past the first authentication factor, we should use the
            // corresponding password (if there is one)
            connection.config.password =
              this[`password${this.authenticationFactor}`];
            // update the current authentication factor
            this.authenticationFactor += 1;
          }
          // if marker === 0x02, it means it is an AuthNextFactor packet,
          // which is similar in structure to an AuthSwitchRequest packet,
          // so, we can use it directly
          authSwitch.authSwitchRequest(packet, connection, this);
        }
        return ClientHandshake.prototype.handshakeResult;
      } catch (err) {
        // Authentication errors are fatal
        err.code = 'AUTH_SWITCH_PLUGIN_ERROR';
        err.fatal = true;

        if (this.onResult) {
          this.onResult(err);
        } else {
          this.emit('error', err);
        }
        return null;
      }
    }
    if (marker !== 0) {
      const err = new Error('Unexpected packet during handshake phase');
      // Unknown handshake errors are fatal
      err.code = 'HANDSHAKE_UNKNOWN_ERROR';
      err.fatal = true;

      if (this.onResult) {
        this.onResult(err);
      } else {
        this.emit('error', err);
      }
      return null;
    }
    // this should be called from ClientHandshake command only
    // and skipped when called from ChangeUser command
    if (!connection.authorized) {
      connection.authorized = true;
      if (connection.config.compress) {
        const enableCompression =
          require('../compressed_protocol.js').enableCompression;
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
