// Copyright (c) 2021, Oracle and/or its affiliates.

import type { Connection } from '../../../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../../index.js';
import Command from '../../../../lib/commands/command.js';
import Packets from '../../../../lib/packets/index.js';

type AuthFactorConfig = {
  pluginName: string;
  pluginData: Buffer;
};

type AuthPluginMetadata = {
  connection: Connection;
  command: string;
};

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

class TestChangeUserMultiFactor extends Command {
  args: AuthFactorConfig[];
  authFactor: number;
  serverHello: unknown;

  constructor(args: AuthFactorConfig[]) {
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
    return TestChangeUserMultiFactor.prototype.acceptConnection;
  }

  acceptConnection(_packet: unknown, connection: Connection) {
    connection.writeOk();
    return TestChangeUserMultiFactor.prototype.readChangeUser;
  }

  readChangeUser(_packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const asr = new Packets.AuthSwitchRequest(this.args[this.authFactor]);
    connection.writePacket(asr.toPacket());
    return TestChangeUserMultiFactor.prototype.sendAuthNextFactor;
  }

  sendAuthNextFactor(
    _packet: unknown,
    connection: Connection
  ): (_packet: unknown, connection: Connection) => unknown {
    console.log('this.authFactor:', this.authFactor);
    // const asr = Packets.AuthSwitchResponse.fromPacket(packet);
    // assert.deepStrictEqual(asr.data.toString(), this.args[this.authFactor].pluginName);
    if (this.authFactor === 1) {
      // send OK_Packet after the 3rd authentication factor
      connection.writeOk();
      return TestChangeUserMultiFactor.prototype.dispatchCommands;
    }
    this.authFactor += 1;
    // @ts-expect-error: TODO: implement typings
    const anf = new Packets.AuthNextFactor(this.args[this.authFactor]);
    // @ts-expect-error: TODO: implement typings
    const encoding = connection.serverConfig.encoding;
    connection.writePacket(anf.toPacket(encoding));
    return TestChangeUserMultiFactor.prototype.sendAuthNextFactor;
  }

  dispatchCommands(_packet: unknown, connection: Connection) {
    connection.end();
    return TestChangeUserMultiFactor.prototype.dispatchCommands;
  }
}

await describe('Change User Multi Factor', async () => {
  const server = mysql.createServer((conn: Connection) => {
    // @ts-expect-error: TODO: implement typings
    conn.serverConfig = {};
    // @ts-expect-error: TODO: implement typings
    conn.serverConfig.encoding = 'cesu8';
    // @ts-expect-error: TODO: implement typings
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
      ])
    );
  });

  const completed: string[] = [];
  const password1 = 'secret1';
  const password2 = 'secret2';

  await it('should handle multi-factor authentication during change user', async () => {
    await new Promise<void>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;
        const conn = mysql.createConnection({
          port: port,
          authPlugins: {
            auth_test_plugin1(options: AuthPluginMetadata) {
              return () => {
                if (options.connection.config.password !== password1) {
                  return assert.fail(
                    'Incorrect authentication factor password.'
                  );
                }

                const pluginName = 'auth_test_plugin1';
                completed.push(pluginName);

                return Buffer.from(pluginName);
              };
            },
            auth_test_plugin2(options: AuthPluginMetadata) {
              return () => {
                if (options.connection.config.password !== password2) {
                  return assert.fail(
                    'Incorrect authentication factor password.'
                  );
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

            conn.end(() => {
              server.close(() => resolve());
            });
          });
        });
      });
    });
  });
});
