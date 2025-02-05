// Copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

const mysql = require('../../index.js');
const Command = require('../../lib/commands/command.js');
const Packets = require('../../lib/packets/index.js');
const { Buffer } = require('node:buffer');
const { assert } = require('poku');
const process = require('node:process');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

class TestAuthMultiFactor extends Command {
  constructor(args) {
    super();
    this.args = args;
    this.authFactor = 0;
  }

  start(_, connection) {
    const serverHelloPacket = new Packets.Handshake({
      // "required" properties
      serverVersion: 'node.js rocks',
      // the server should announce support for the
      // "MULTI_FACTOR_AUTHENTICATION" capability
      capabilityFlags: 0xdfffffff,
    });
    this.serverHello = serverHelloPacket;
    serverHelloPacket.setScrambleData(() => {
      connection.writePacket(serverHelloPacket.toPacket(0));
    });
    return TestAuthMultiFactor.prototype.sendAuthSwitchRequest;
  }

  sendAuthSwitchRequest(_, connection) {
    const asr = new Packets.AuthSwitchRequest(this.args[this.authFactor]);
    connection.writePacket(asr.toPacket());
    return TestAuthMultiFactor.prototype.sendAuthNextFactor;
  }

  sendAuthNextFactor(packet, connection) {
    const asr = Packets.AuthSwitchResponse.fromPacket(packet);
    assert.deepStrictEqual(
      asr.data.toString(),
      this.args[this.authFactor].pluginName,
    );
    if (this.authFactor === 2) {
      // send OK_Packet after the 3rd authentication factor
      connection.writeOk();
      return TestAuthMultiFactor.prototype.dispatchCommands;
    }
    this.authFactor += 1;
    const anf = new Packets.AuthNextFactor(this.args[this.authFactor]);
    connection.writePacket(anf.toPacket(connection.serverConfig.encoding));
    return TestAuthMultiFactor.prototype.sendAuthNextFactor;
  }

  dispatchCommands(_, connection) {
    connection.end();
    return TestAuthMultiFactor.prototype.dispatchCommands;
  }
}

const server = mysql.createServer((conn) => {
  conn.serverConfig = {};
  conn.serverConfig.encoding = 'cesu8';
  conn.addCommand(
    new TestAuthMultiFactor([
      {
        // already covered by test-auth-switch
        pluginName: 'auth_test_plugin1',
        pluginData: Buffer.from('foo'),
      },
      {
        // 2nd factor auth plugin
        pluginName: 'auth_test_plugin2',
        pluginData: Buffer.from('bar'),
      },
      {
        // 3rd factor auth plugin
        pluginName: 'auth_test_plugin3',
        pluginData: Buffer.from('baz'),
      },
    ]),
  );
});

const completed = [];

const portfinder = require('portfinder');
portfinder.getPort((_, port) => {
  server.listen(port);
  const conn = mysql.createConnection({
    port: port,
    password: 'secret1',
    password2: 'secret2',
    password3: 'secret3',
    authPlugins: {
      auth_test_plugin1() {
        return () => {
          const pluginName = 'auth_test_plugin1';
          completed.push(pluginName);

          return Buffer.from(pluginName);
        };
      },
      auth_test_plugin2(options) {
        return () => {
          if (
            options.connection.config.password !==
            options.connection.config.password2
          ) {
            return assert.fail('Incorrect authentication factor password.');
          }

          const pluginName = 'auth_test_plugin2';
          completed.push(pluginName);

          return Buffer.from(pluginName);
        };
      },
      auth_test_plugin3(options) {
        return () => {
          if (
            options.connection.config.password !==
            options.connection.config.password3
          ) {
            return assert.fail('Incorrect authentication factor password.');
          }

          const pluginName = 'auth_test_plugin3';
          completed.push(pluginName);

          return Buffer.from(pluginName);
        };
      },
    },
  });

  conn.on('connect', () => {
    assert.deepStrictEqual(completed, [
      'auth_test_plugin1',
      'auth_test_plugin2',
      'auth_test_plugin3',
    ]);

    conn.end();
    server.close();
  });
});
