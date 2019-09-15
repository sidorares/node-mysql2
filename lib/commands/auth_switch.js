const Packets = require('../packets/index.js');
const caching_sha2_password = require('../auth_plugins/caching_sha2_password.js');
const mysql_native_password = require('../auth_plugins/mysql_native_password.js');

const standardAuthPlugins = {
  caching_sha2_password: caching_sha2_password({}),
  mysql_native_password: mysql_native_password({})
};

function authSwitchRequest(packet, connection) {
  const { pluginName, pluginData } = Packets.AuthSwitchRequest.fromPacket(
    packet
  );
  let authPlugin =
    connection.config.authPlugins && connection.config.authPlugins[pluginName];
  if (connection.config.authSwitchHandler) {
    authPlugin = connection.config.authSwitchHandler;
    process.exit(-1);
  }
  if (!authPlugin) {
    authPlugin = standardAuthPlugins[pluginName];
  }
  if (!authPlugin) {
    throw new Error(
      `Server requests authentication using unknown plugin ${pluginName}. See ${'TODO: add plugins doco here'} on how to configure or author authentication plugins.`
    );
  }
  connection._authPlugin = authPlugin({ connection });
  Promise.resolve(connection._authPlugin(pluginData)).then(data => {
    if (data) {
      connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
    }
  });
}

function authSwitchRequestMoreData(packet, connection) {
  if (!connection._authPlugin) {
    throw new Error(
      'AuthPluginMoreData received but no auth plugin instance found'
    );
  }
  const { data } = Packets.AuthSwitchRequestMoreData.fromPacket(packet);
  Promise.resolve(connection._authPlugin(data))
    .then(data => {
      if (data) {
        connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
      }
    })
    .catch(err => {
      console.log('err!!!!', err);
    });
}

module.exports = {
  authSwitchRequest,
  authSwitchRequestMoreData
};

/*
if (marker === 1) {
  const { data } = Packets.AuthSwitchRequestMoreData.fromPacket(packet);
  console.log('Handshake Result More', { marker, data });
  Promise.resolve(connection._authPlugin(data)).then(data => {
    data && connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
  });
  return ClientHandshake.prototype.handshakeResult;
} else {
  const { pluginName, pluginData } = Packets.AuthSwitchRequest.fromPacket(packet);
  connection._authPlugin = connection.config.authSwitchHandler({ connection });
  Promise.resolve(connection._authPlugin(pluginData)).then(data => {
    data && connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
  });
  return ClientHandshake.prototype.handshakeResult;
}

/*
      if (authSwitchHandlerParams.pluginName === 'mysql_native_password') {
        const authToken = this.calculateNativePasswordAuthToken(
          authSwitchHandlerParams.pluginData
        );
        connection.writePacket(
          new Packets.AuthSwitchResponse(authToken).toPacket()
        );
      } else if (connection.config.authSwitchHandler) {
        connection.config.authSwitchHandler(
          authSwitchHandlerParams,
          (err, data) => {
            if (err) {
              connection.emit('error', err);
              return;
            }
            connection.writePacket(
              new Packets.AuthSwitchResponse(data).toPacket()
            );
          }
        );
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
      */
