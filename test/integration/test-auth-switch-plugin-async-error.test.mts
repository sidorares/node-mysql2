// Copyright (c) 2021, Oracle and/or its affiliates.

import type { AuthPlugin } from '../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../index.js';
import Command from '../../lib/commands/command.js';
import Packets from '../../lib/packets/index.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'EPIPE') return;
  throw err;
});

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

await describe('Auth Switch Plugin Async Error', async () => {
  await it('should handle auth plugin async error', async () => {
    let clientError:
      | { code?: string; message?: string; fatal?: boolean }
      | undefined;
    let serverError: NodeJS.ErrnoException | undefined;

    await new Promise<void>((resolve) => {
      // eslint-disable-next-line prefer-const
      let checkDone: () => void;

      const server = mysql.createServer((conn) => {
        conn.on('error', (err: NodeJS.ErrnoException) => {
          serverError = err;
          checkDone();
        });
        // @ts-expect-error: TODO: implement typings
        conn.addCommand(
          new TestAuthSwitchPluginError({
            pluginName: 'auth_test_plugin',
            pluginData: Buffer.allocUnsafe(0),
          })
        );
      });

      checkDone = () => {
        if (!clientError || !serverError) return;
        server.close(() => resolve());
      };

      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;

        const conn = mysql.createConnection({
          port: port,
          authPlugins: {
            auth_test_plugin: ((_plginMetadata) =>
              function (_pluginData) {
                return Promise.reject(Error('boom'));
              }) as AuthPlugin,
          },
        });

        conn.on('error', (err) => {
          clientError = err as {
            code?: string;
            message?: string;
            fatal?: boolean;
          };
          conn.destroy();
          checkDone();
        });
      });
    });

    strict.ok(
      serverError?.code === 'PROTOCOL_CONNECTION_LOST' ||
        serverError?.code === 'ECONNRESET'
    );
    strict.equal(clientError?.code, 'AUTH_SWITCH_PLUGIN_ERROR');
    strict.equal(clientError?.message, 'boom');
    strict.equal(clientError?.fatal, true);
  });
});
