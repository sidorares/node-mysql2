import type { Connection } from '../../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../index.js';
import Command from '../../../lib/commands/command.js';
import Packets from '../../../lib/packets/index.js';
import packageJson from '../../../package.json' with { type: 'json' };

type AuthSwitchArgs = {
  pluginName: string;
  pluginData: Buffer;
};

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const connectAttributes = { foo: 'bar', baz: 'foo' };

const defaultConnectAttributes = {
  _client_name: 'Node-MySQL-2',
  _client_version: packageJson.version,
};

let count = 0;

class TestAuthSwitchHandshake extends Command {
  args: AuthSwitchArgs;
  serverHello: unknown;

  constructor(args: AuthSwitchArgs) {
    super();
    this.args = args;
  }

  start(_packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
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

  readClientReply(packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const clientHelloReply = Packets.HandshakeResponse.fromPacket(packet);
    assert.equal(clientHelloReply.user, 'test_user');
    assert.equal(clientHelloReply.database, 'test_database');
    assert.equal(clientHelloReply.authPluginName, 'mysql_native_password');
    assert.deepEqual(clientHelloReply.connectAttributes, {
      ...connectAttributes,
      ...defaultConnectAttributes,
    });
    // @ts-expect-error: TODO: implement typings
    const asr = new Packets.AuthSwitchRequest(this.args);
    connection.writePacket(asr.toPacket());
    return TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
  }

  readClientAuthSwitchResponse(
    packet: unknown,
    connection: Connection
  ): (_packet: unknown, connection: Connection) => unknown {
    // @ts-expect-error: TODO: implement typings
    Packets.AuthSwitchResponse.fromPacket(packet);
    count++;
    if (count < 10) {
      // @ts-expect-error: TODO: implement typings
      const asrmd = new Packets.AuthSwitchRequestMoreData(
        Buffer.from(`hahaha ${count}`)
      );
      connection.writePacket(asrmd.toPacket());
      return TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
    }
    connection.writeOk();
    return TestAuthSwitchHandshake.prototype.dispatchCommands;
  }

  dispatchCommands(_packet: unknown, connection: Connection) {
    // Quit command here
    // TODO: assert it's actually Quit
    connection.end();
    return TestAuthSwitchHandshake.prototype.dispatchCommands;
  }
}

await describe('Auth Switch', async () => {
  await it('should handle auth switch handshake', async () => {
    const server = mysql.createServer((conn: Connection) => {
      // @ts-expect-error: TODO: implement typings
      conn.serverConfig = {};
      // @ts-expect-error: TODO: implement typings
      conn.serverConfig.encoding = 'cesu8';
      // @ts-expect-error: TODO: implement typings
      conn.addCommand(
        new TestAuthSwitchHandshake({
          pluginName: 'auth_test_plugin',
          pluginData: Buffer.from('f{tU-{K@BhfHt/-4^Z,'),
        })
      );
    });

    await new Promise<void>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;

        const makeSwitchHandler = function () {
          let count = 0;
          return function (
            data: { pluginName: string; pluginData: Buffer },
            cb: (err: null, response: string) => void
          ) {
            if (count === 0) {
              assert.equal(data.pluginName, 'auth_test_plugin');
            } else {
              assert.equal(data.pluginData.toString(), `hahaha ${count}`);
            }

            count++;
            cb(null, `some data back${count}`);
          };
        };

        const conn = mysql.createConnection({
          user: 'test_user',
          password: 'test',
          database: 'test_database',
          port: port,
          authSwitchHandler: makeSwitchHandler(),
          connectAttributes: connectAttributes,
        });

        conn.on(
          'connect',
          (data: { serverVersion: string; connectionId: number }) => {
            assert.equal(data.serverVersion, 'node.js rocks');
            assert.equal(data.connectionId, 1234);

            conn.end();
            // @ts-expect-error: TODO: implement typings
            server.close();
            resolve();
          }
        );
      });
    });
  });
});
