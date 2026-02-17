// Copyright (c) 2021, Oracle and/or its affiliates.

import assert from 'node:assert';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import portfinder from 'portfinder';
import mysql from '../../../index.js';
import Command from '../../../lib/commands/command.js';
import Packets from '../../../lib/packets/index.js';
import Packet from '../../../lib/packets/packet.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

class TestUnknownHandshakePacket extends Command {
  args: Buffer;
  // @ts-expect-error: TODO: implement typings
  serverHello: InstanceType<typeof Packets.Handshake>;

  constructor(args: Buffer) {
    super();
    this.args = args;
  }

  // @ts-expect-error: TODO: implement typings
  start(_packet, connection) {
    // @ts-expect-error: TODO: implement typings
    const serverHelloPacket = new Packets.Handshake({
      // "required" properties
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
    });
    this.serverHello = serverHelloPacket;
    serverHelloPacket.setScrambleData(() => {
      connection.writePacket(serverHelloPacket.toPacket(0));
    });
    return TestUnknownHandshakePacket.prototype.writeUnexpectedPacket;
  }

  // @ts-expect-error: TODO: implement typings
  writeUnexpectedPacket(_packet, connection) {
    const length = 6 + this.args.length;
    const buffer = Buffer.allocUnsafe(length);
    const up = new Packet(0, buffer, 0, length);
    up.offset = 4;
    up.writeInt8(0xfd);
    up.writeBuffer(this.args);
    connection.writePacket(up);
    return TestUnknownHandshakePacket.prototype.finish;
  }

  // @ts-expect-error: TODO: implement typings
  finish(_packet, connection) {
    connection.end();
    return TestUnknownHandshakePacket.prototype.finish;
  }
}

const server = mysql.createServer((conn) => {
  // @ts-expect-error: TODO: implement typings
  conn.addCommand(new TestUnknownHandshakePacket(Buffer.alloc(0)));
});

let error: { code?: string; message?: string; fatal?: boolean };
let uncaughtExceptions = 0;

portfinder.getPort((_err, port) => {
  server.listen(port);
  const conn = mysql.createConnection({
    port: port,
  });

  conn.on('error', (err) => {
    error = err;

    conn.end();
    // @ts-expect-error: TODO: implement typings
    server.close();
  });
});

process.on('uncaughtException', (err: Error & { code?: string }) => {
  // The plugin reports a fatal error
  assert.equal(error.code, 'HANDSHAKE_UNKNOWN_ERROR');
  assert.equal(error.message, 'Unexpected packet during handshake phase');
  assert.equal(error.fatal, true);
  // The server must close the connection
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');

  uncaughtExceptions += 1;
});

process.on('exit', () => {
  assert.equal(uncaughtExceptions, 1);
});
