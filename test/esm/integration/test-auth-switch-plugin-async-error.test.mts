// Copyright (c) 2021, Oracle and/or its affiliates.

import type { AuthPlugin } from '../../../index.js';
import assert from 'node:assert';
import { Buffer } from 'node:buffer';
import process from 'node:process';
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

const server = mysql.createServer((conn) => {
  // @ts-expect-error: TODO: implement typings
  conn.addCommand(
    new TestAuthSwitchPluginError({
      pluginName: 'auth_test_plugin',
      pluginData: Buffer.allocUnsafe(0),
    })
  );
});

let error: { code?: string; message?: string; fatal?: boolean } | undefined;
let uncaughtExceptions = 0;

portfinder.getPort((_err, port) => {
  server.listen(port);
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
    error = err as { code?: string; message?: string; fatal?: boolean };

    conn.end();
    // @ts-expect-error: TODO: implement typings
    server.close();
  });
});

process.on('uncaughtException', (err) => {
  // The plugin reports a fatal error
  assert.equal(error?.code, 'AUTH_SWITCH_PLUGIN_ERROR');
  assert.equal(error?.message, 'boom');
  assert.equal(error?.fatal, true);
  // The server must close the connection
  assert.equal((err as { code?: string }).code, 'PROTOCOL_CONNECTION_LOST');

  uncaughtExceptions += 1;
});

process.on('exit', () => {
  assert.equal(uncaughtExceptions, 1);
});
