// Copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

const mysql = require('../../../index.js');
const Command = require('../../../lib/commands/command.js');
const Packets = require('../../../lib/packets/index.js');
const { Buffer } = require('node:buffer');
const { assert } = require('poku');
const process = require('node:process');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

class TestChangeUserMultiFactor extends Command {
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
    return TestChangeUserMultiFactor.prototype.acceptConnection;
  }

  acceptConnection(_, connection) {
    connection.writeOk();
    return TestChangeUserMultiFactor.prototype.readChangeUser;
  }

  readChangeUser(_, connection) {
    const asr = new Packets.AuthSwitchRequest(this.args[this.authFactor]);
    connection.writePacket(asr.toPacket());
    return TestChangeUserMultiFactor.prototype.sendAuthNextFactor;
  }

  sendAuthNextFactor(_, connection) {
    console.log('this.authFactor:', this.authFactor);
    // const asr = Packets.AuthSwitchResponse.fromPacket(packet);
    // assert.deepStrictEqual(asr.data.toString(), this.args[this.authFactor].pluginName);
    if (this.authFactor === 1) {
      // send OK_Packet after the 3rd authentication factor
      connection.writeOk();
      return TestChangeUserMultiFactor.prototype.dispatchCommands;
    }
    this.authFactor += 1;
    const anf = new Packets.AuthNextFactor(this.args[this.authFactor]);
    connection.writePacket(anf.toPacket(connection.serverConfig.encoding));
    return TestChangeUserMultiFactor.prototype.sendAuthNextFactor;
  }

  dispatchCommands(_, connection) {
    connection.end();
    return TestChangeUserMultiFactor.prototype.dispatchCommands;
  }
}

const server = mysql.createServer((conn) => {
  conn.serverConfig = {};
  conn.serverConfig.encoding = 'cesu8';
  conn.addCommand(
    new TestChangeUserMultiFactor([
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
    ]),
  );
});

const completed = [];
const password1 = 'secret1';
const password2 = 'secret2';

const portfinder = require('portfinder');
portfinder.getPort((_, port) => {
  server.listen(port);
  const conn = mysql.createConnection({
    port: port,
    authPlugins: {
      auth_test_plugin1(options) {
        return () => {
          if (options.connection.config.password !== password1) {
            return assert.fail('Incorrect authentication factor password.');
          }

          const pluginName = 'auth_test_plugin1';
          completed.push(pluginName);

          return Buffer.from(pluginName);
        };
      },
      auth_test_plugin2(options) {
        return () => {
          if (options.connection.config.password !== password2) {
            return assert.fail('Incorrect authentication factor password.');
          }

          const pluginName = 'auth_test_plugin2';
          completed.push(pluginName);

          return Buffer.from(pluginName);
        };
      },
    },
  });

  conn.on('connect', () => {
    conn.changeUser({ password1, password2 }, () => {
      assert.deepStrictEqual(completed, [
        'auth_test_plugin1',
        'auth_test_plugin2',
      ]);

      conn.end();
      server.close();
    });
  });
});
