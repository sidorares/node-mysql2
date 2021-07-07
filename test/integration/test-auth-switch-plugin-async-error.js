// Copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

const mysql = require('../../index.js');
const Command = require('../../lib/commands/command.js');
const Packets = require('../../lib/packets/index.js');

const assert = require('assert');

class TestAuthSwitchPluginError extends Command {
  constructor(args) {
    super();
    this.args = args;
  }

  start(_, connection) {
    const serverHelloPacket = new Packets.Handshake({
      // "required" properties
      protocolVersion: 10,
      serverVersion: 'node.js rocks'
    });
    this.serverHello = serverHelloPacket;
    serverHelloPacket.setScrambleData(() => {
      connection.writePacket(serverHelloPacket.toPacket(0));
    });
    return TestAuthSwitchPluginError.prototype.sendAuthSwitchRequest;
  }

  sendAuthSwitchRequest(_, connection) {
    const asr = new Packets.AuthSwitchRequest(this.args);
    connection.writePacket(asr.toPacket());
    return TestAuthSwitchPluginError.prototype.finish;
  }

  finish(_, connection) {
    connection.end();
    return TestAuthSwitchPluginError.prototype.finish;
  }
}

const server = mysql.createServer(conn => {
  conn.addCommand(
    new TestAuthSwitchPluginError({
      pluginName: 'auth_test_plugin',
      pluginData: Buffer.allocUnsafe(0)
    })
  );
});

let error;
let uncaughtExceptions = 0;

const portfinder = require('portfinder');
portfinder.getPort((_, port) => {
  server.listen(port);
  const conn = mysql.createConnection({
    port: port,
    authPlugins: {
      auth_test_plugin () {
        return function () {
          return Promise.reject(Error('boom'));
        }
      }
    }
  });

  conn.on('error', err => {
    error = err;

    conn.end();
    server.close();
  });
});

process.on('uncaughtException', err => {
  // The plugin reports a fatal error
  assert.equal(error.code, 'AUTH_SWITCH_PLUGIN_ERROR');
  assert.equal(error.message, 'boom');
  assert.equal(error.fatal, true);
  // The server must close the connection
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');

  uncaughtExceptions += 1;
});

process.on('exit', () => {
  assert.equal(uncaughtExceptions, 1);
});
