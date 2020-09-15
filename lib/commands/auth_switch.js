'use strict';

const Packets = require('../packets/index.js');
const sha256_password = require('../auth_plugins/sha256_password');
const caching_sha2_password = require('../auth_plugins/caching_sha2_password.js');
const mysql_native_password = require('../auth_plugins/mysql_native_password.js');

const standardAuthPlugins = {
  sha256_password: sha256_password({}),
  caching_sha2_password: caching_sha2_password({}),
  mysql_native_password: mysql_native_password({})
};

function warnLegacyAuthSwitch() {
  console.warn(
    'WARNING! authSwitchHandler api is deprecated, please use new authPlugins api'
  );
}

function authSwitchRequest(packet, connection, command) {
  const { pluginName, pluginData } = Packets.AuthSwitchRequest.fromPacket(
    packet
  );
  let authPlugin =
    connection.config.authPlugins && connection.config.authPlugins[pluginName];

  // legacy plugin api don't allow to override mysql_native_password
  // if pluginName is mysql_native_password it's using standard auth4.1 auth
  if (
    connection.config.authSwitchHandler &&
    pluginName !== 'mysql_native_password'
  ) {
    const legacySwitchHandler = connection.config.authSwitchHandler;
    warnLegacyAuthSwitch();
    legacySwitchHandler({ pluginName, pluginData }, (err, data) => {
      if (err) {
        connection.emit('error', err);
        return;
      }
      connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
    });
    return;
  }
  if (!authPlugin) {
    authPlugin = standardAuthPlugins[pluginName];
  }
  if (!authPlugin) {
    throw new Error(
      `Server requests authentication using unknown plugin ${pluginName}. See ${'TODO: add plugins doco here'} on how to configure or author authentication plugins.`
    );
  }
  connection._authPlugin = authPlugin({ connection, command });
  Promise.resolve(connection._authPlugin(pluginData)).then(data => {
    if (data) {
      connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
    }
  });
}

function authSwitchRequestMoreData(packet, connection) {
  const { data } = Packets.AuthSwitchRequestMoreData.fromPacket(packet);

  if (connection.config.authSwitchHandler) {
    const legacySwitchHandler = connection.config.authSwitchHandler;
    warnLegacyAuthSwitch();
    legacySwitchHandler({ pluginData: data }, (err, data) => {
      if (err) {
        connection.emit('error', err);
        return;
      }
      connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
    });
    return;
  }

  if (!connection._authPlugin) {
    throw new Error(
      'AuthPluginMoreData received but no auth plugin instance found'
    );
  }
  Promise.resolve(connection._authPlugin(data)).then(data => {
    if (data) {
      connection.writePacket(new Packets.AuthSwitchResponse(data).toPacket());
    }
  });
}

module.exports = {
  authSwitchRequest,
  authSwitchRequestMoreData
};
