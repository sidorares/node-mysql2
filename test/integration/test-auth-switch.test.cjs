'use strict';

const mysql = require('../../index.js');
const Command = require('../../lib/commands/command.js');
const Packets = require('../../lib/packets/index.js');
const { version } = require('../../package.json');
const { Buffer } = require('node:buffer');
const { assert } = require('poku');
const process = require('node:process');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const connectAttributes = { foo: 'bar', baz: 'foo' };

const defaultConnectAttributes = {
  _client_name: 'Node-MySQL-2',
  _client_version: version,
};

let count = 0;

class TestAuthSwitchHandshake extends Command {
  constructor(args) {
    super();
    this.args = args;
  }

  start(packet, connection) {
    const serverHelloPacket = new Packets.Handshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff,
    });
    this.serverHello = serverHelloPacket;
    serverHelloPacket.setScrambleData(() => {
      connection.writePacket(serverHelloPacket.toPacket(0));
    });
    return TestAuthSwitchHandshake.prototype.readClientReply;
  }

  readClientReply(packet, connection) {
    const clientHelloReply = Packets.HandshakeResponse.fromPacket(packet);
    assert.equal(clientHelloReply.user, 'test_user');
    assert.equal(clientHelloReply.database, 'test_database');
    assert.equal(clientHelloReply.authPluginName, 'mysql_native_password');
    assert.deepEqual(clientHelloReply.connectAttributes, {
      ...connectAttributes,
      ...defaultConnectAttributes,
    });
    const asr = new Packets.AuthSwitchRequest(this.args);
    connection.writePacket(asr.toPacket());
    return TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
  }

  readClientAuthSwitchResponse(packet, connection) {
    Packets.AuthSwitchResponse.fromPacket(packet);
    count++;
    if (count < 10) {
      const asrmd = new Packets.AuthSwitchRequestMoreData(
        Buffer.from(`hahaha ${count}`),
      );
      connection.writePacket(asrmd.toPacket());
      return TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
    }
    connection.writeOk();
    return TestAuthSwitchHandshake.prototype.dispatchCommands;
  }

  dispatchCommands(packet, connection) {
    // Quit command here
    // TODO: assert it's actually Quit
    connection.end();
    return TestAuthSwitchHandshake.prototype.dispatchCommands;
  }
}

const server = mysql.createServer((conn) => {
  conn.serverConfig = {};
  conn.serverConfig.encoding = 'cesu8';
  conn.addCommand(
    new TestAuthSwitchHandshake({
      pluginName: 'auth_test_plugin',
      pluginData: Buffer.from('f{tU-{K@BhfHt/-4^Z,'),
    }),
  );
});

// REVIEW: Unused var

const portfinder = require('portfinder');
portfinder.getPort((err, port) => {
  const makeSwitchHandler = function () {
    let count = 0;
    return function (data, cb) {
      if (count === 0) {
        assert.equal(data.pluginName, 'auth_test_plugin');
      } else {
        assert.equal(data.pluginData.toString(), `hahaha ${count}`);
      }

      count++;
      cb(null, `some data back${count}`);
    };
  };

  server.listen(port);
  const conn = mysql.createConnection({
    user: 'test_user',
    password: 'test',
    database: 'test_database',
    port: port,
    authSwitchHandler: makeSwitchHandler(),
    connectAttributes: connectAttributes,
  });

  conn.on('connect', (data) => {
    assert.equal(data.serverVersion, 'node.js rocks');
    assert.equal(data.connectionId, 1234);

    conn.end();
    server.close();
  });
});
