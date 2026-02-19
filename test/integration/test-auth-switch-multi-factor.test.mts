// Copyright (c) 2021, Oracle and/or its affiliates.

import type { Connection } from '../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../index.js';
import Command from '../../lib/commands/command.js';
import Packets from '../../lib/packets/index.js';

type AuthSwitchArgs = {
  pluginName: string;
  pluginData: Buffer;
};

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

class TestAuthMultiFactor extends Command {
  args: AuthSwitchArgs[];
  authFactor: number;
  serverHello: unknown;

  constructor(args: AuthSwitchArgs[]) {
    super();
    this.args = args;
    this.authFactor = 0;
  }

  start(_packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
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

  sendAuthSwitchRequest(_packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const asr = new Packets.AuthSwitchRequest(this.args[this.authFactor]);
    connection.writePacket(asr.toPacket());
    return TestAuthMultiFactor.prototype.sendAuthNextFactor;
  }

  sendAuthNextFactor(packet: unknown, connection: Connection): Function {
    // @ts-expect-error: TODO: implement typings
    const asr = Packets.AuthSwitchResponse.fromPacket(packet);
    assert.deepStrictEqual(
      asr.data.toString(),
      this.args[this.authFactor].pluginName
    );
    if (this.authFactor === 2) {
      // send OK_Packet after the 3rd authentication factor
      connection.writeOk();
      return TestAuthMultiFactor.prototype.dispatchCommands;
    }
    this.authFactor += 1;
    // @ts-expect-error: TODO: implement typings
    const anf = new Packets.AuthNextFactor(this.args[this.authFactor]);
    // @ts-expect-error: TODO: implement typings
    connection.writePacket(anf.toPacket(connection.serverConfig.encoding));
    return TestAuthMultiFactor.prototype.sendAuthNextFactor;
  }

  dispatchCommands(_packet: unknown, connection: Connection) {
    connection.end();
    return TestAuthMultiFactor.prototype.dispatchCommands;
  }
}

await describe('Auth Switch Multi Factor', async () => {
  await it('should handle multi-factor authentication', async () => {
    const server = mysql.createServer((conn: Connection) => {
      // @ts-expect-error: TODO: implement typings
      conn.serverConfig = {};
      // @ts-expect-error: TODO: implement typings
      conn.serverConfig.encoding = 'cesu8';
      // @ts-expect-error: TODO: implement typings
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
        ])
      );
    });

    const completed: string[] = [];

    await new Promise<void>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;

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
            auth_test_plugin2(options: {
              connection: Connection;
              command: string;
            }) {
              return () => {
                if (
                  options.connection.config.password !==
                  options.connection.config.password2
                ) {
                  return assert.fail(
                    'Incorrect authentication factor password.'
                  );
                }

                const pluginName = 'auth_test_plugin2';
                completed.push(pluginName);

                return Buffer.from(pluginName);
              };
            },
            auth_test_plugin3(options: {
              connection: Connection;
              command: string;
            }) {
              return () => {
                if (
                  options.connection.config.password !==
                  options.connection.config.password3
                ) {
                  return assert.fail(
                    'Incorrect authentication factor password.'
                  );
                }

                const pluginName = 'auth_test_plugin3';
                completed.push(pluginName);

                return Buffer.from(pluginName);
              };
            },
          },
        });

        conn.on('connect', () => {
          conn.end();
          // @ts-expect-error: TODO: implement typings
          server.close();
          resolve();
        });
      });
    });

    assert.deepStrictEqual(completed, [
      'auth_test_plugin1',
      'auth_test_plugin2',
      'auth_test_plugin3',
    ]);
  });
});
