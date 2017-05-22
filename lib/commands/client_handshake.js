var util = require('util');

var Command = require('./command.js');
var Packets = require('../packets/index.js');
var ClientConstants = require('../constants/client.js');
var CharsetToEncoding = require('../constants/charset_encodings.js');

function ClientHandshake(clientFlags) {
  this.handshake = null;
  this.clientFlags = clientFlags;
  Command.call(this);
}
util.inherits(ClientHandshake, Command);

ClientHandshake.prototype.start = function() {
  return ClientHandshake.prototype.handshakeInit;
};

ClientHandshake.prototype.sendSSLRequest = function(connection) {
  var sslRequest = new Packets.SSLRequest(
    this.clientFlags,
    connection.config.charsetNumber
  );
  connection.writePacket(sslRequest.toPacket());
};

function flagNames(flags) {
  var res = [];
  for (var c in ClientConstants) {
    if (flags & ClientConstants[c]) {
      res.push(c.replace(/_/g, ' ').toLowerCase());
    }
  }
  return res;
}

ClientHandshake.prototype.sendCredentials = function(connection) {
  if (connection.config.debug) {
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

  var handshakeResponse = new Packets.HandshakeResponse({
    flags: this.clientFlags,
    user: this.user,
    database: this.database,
    password: this.password,
    passwordSha1: this.passwordSha1,
    charsetNumber: connection.config.charsetNumber,
    authPluginData1: this.handshake.authPluginData1,
    authPluginData2: this.handshake.authPluginData2,
    compress: connection.config.compress,
    connectAttributes: connection.config.connectAttributes
  });
  connection.writePacket(handshakeResponse.toPacket());
};

var auth41 = require('../auth_41.js');
ClientHandshake.prototype.calculateNativePasswordAuthToken = function(
  authPluginData
) {
  // TODO: dont split into authPluginData1 and authPluginData2, instead join when 1 & 2 received
  var authPluginData1 = authPluginData.slice(0, 8);
  var authPluginData2 = authPluginData.slice(8, 20);
  var authToken;
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
};

ClientHandshake.prototype.handshakeInit = function(helloPacket, connection) {
  var command = this;

  this.on('error', function(e) {
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
  var serverSSLSupport = this.handshake.capabilityFlags & ClientConstants.SSL;

  // use compression only if requested by client and supported by server
  connection.config.compress =
    connection.config.compress &&
    this.handshake.capabilityFlags & ClientConstants.COMPRESS;
  this.clientFlags = this.clientFlags | connection.config.compress;

  if (connection.config.ssl) {
    // client requires SSL but server does not support it
    if (!serverSSLSupport) {
      var err = new Error('Server does not support secure connnection');
      err.code = 'HANDSHAKE_NO_SSL_SUPPORT';
      err.fatal = true;
      command.emit('error', err);
      return false;
    }
    // send ssl upgrade request and immediately upgrade connection to secure
    this.clientFlags |= ClientConstants.SSL;
    this.sendSSLRequest(connection);
    connection.startTLS(function(err) {
      // after connection is secure
      if (err) {
        // SSL negotiation error are fatal
        err.code = 'HANDSHAKE_SSL_ERROR';
        err.fatal = true;
        command.emit('error', err);
        return;
      }
      // rest of communication is encrypted
      command.sendCredentials(connection);
    });
  } else {
    this.sendCredentials(connection);
  }
  return ClientHandshake.prototype.handshakeResult;
};

ClientHandshake.prototype.handshakeResult = function(packet, connection) {
  var marker = packet.peekByte();
  if (marker === 0xfe || marker === 1) {
    var asr, asrmd;
    var authSwitchHandlerParams = {};
    if (marker === 1) {
      asrmd = Packets.AuthSwitchRequestMoreData.fromPacket(packet);
      authSwitchHandlerParams.pluginData = asrmd.data;
    } else {
      asr = Packets.AuthSwitchRequest.fromPacket(packet);
      authSwitchHandlerParams.pluginName = asr.pluginName;
      authSwitchHandlerParams.pluginData = asr.pluginData;
    }
    if (authSwitchHandlerParams.pluginName == 'mysql_native_password') {
      var authToken = this.calculateNativePasswordAuthToken(
        authSwitchHandlerParams.pluginData
      );
      connection.writePacket(
        new Packets.AuthSwitchResponse(authToken).toPacket()
      );
    } else if (connection.config.authSwitchHandler) {
      connection.config.authSwitchHandler(authSwitchHandlerParams, function(
        err,
        data
      ) {
        if (err) {
          connection.emit('error', err);
          return;
        }
        connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
      });
    } else {
      connection.emit(
        'error',
        new Error(
          'Server requires auth switch, but no auth switch handler provided'
        )
      );
      return null;
    }
    return ClientHandshake.prototype.handshakeResult;
  }

  if (marker !== 0) {
    var err = new Error('Unexpected packet during handshake phase');
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
      var enableCompression = require('../compressed_protocol.js')
        .enableCompression;
      enableCompression(connection);
    }
  }

  if (this.onResult) {
    this.onResult(null);
  }
  return null;
};

module.exports = ClientHandshake;
