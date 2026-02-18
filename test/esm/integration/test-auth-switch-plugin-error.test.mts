// Copyright (c) 2021, Oracle and/or its affiliates.

import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import portfinder from 'portfinder';
import mysql from '../../../index.js';
import Command from '../../../lib/commands/command.js';
import Packets from '../../../lib/packets/index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

class TestAuthSwitchPluginError extends Command {
  args: Record<string, unknown>;
  serverHello: unknown;

  constructor(args: Record<string, unknown>) {
    super();
    this.args = args;
  }

  start(_packet: unknown, connection: unknown) {
    // @ts-expect-error: TODO: implement typings
    const serverHelloPacket = new Packets.Handshake({
      // "required" properties
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
    });
    this.serverHello = serverHelloPacket;
    serverHelloPacket.setScrambleData(() => {
      (connection as { writePacket: (p: unknown) => void }).writePacket(
        serverHelloPacket.toPacket(0)
      );
    });
    return TestAuthSwitchPluginError.prototype.sendAuthSwitchRequest;
  }

  sendAuthSwitchRequest(_packet: unknown, connection: unknown) {
    // @ts-expect-error: TODO: implement typings
    const asr = new Packets.AuthSwitchRequest(this.args);
    (connection as { writePacket: (p: unknown) => void }).writePacket(
      asr.toPacket()
    );
    return TestAuthSwitchPluginError.prototype.finish;
  }

  finish(_packet: unknown, connection: unknown) {
    (connection as { end: () => void }).end();
    return TestAuthSwitchPluginError.prototype.finish;
  }
}

await describe('Auth Switch Plugin Error', async () => {
  await it('should handle auth plugin sync error', async () => {
    let error: { code?: string; message?: string; fatal?: boolean } | undefined;

    await new Promise<void>((resolve) => {
      portfinder.getPort((_err, port) => {
        const server = mysql.createServer((conn) => {
          conn.on('error', (err: NodeJS.ErrnoException) => {
            // The server must close the connection
            assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');

            // The plugin reports a fatal error
            assert.equal(error?.code, 'AUTH_SWITCH_PLUGIN_ERROR');
            assert.equal(error?.message, 'boom');
            assert.equal(error?.fatal, true);
            resolve();
          });
          // @ts-expect-error: TODO: implement typings
          conn.addCommand(
            new TestAuthSwitchPluginError({
              pluginName: 'auth_test_plugin',
              pluginData: Buffer.allocUnsafe(0),
            })
          );
        });

        server.listen(port);
        const conn = mysql.createConnection({
          port: port,
          authPlugins: {
            auth_test_plugin: () => {
              throw new Error('boom');
            },
          },
        });

        conn.on('error', (err) => {
          error = err as {
            code?: string;
            message?: string;
            fatal?: boolean;
          };

          conn.end();
          // @ts-expect-error: TODO: implement typings
          server.close();
        });
      });
    });
  });
});
