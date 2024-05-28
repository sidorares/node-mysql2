// Copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

const mysql = require('../../index.js');
const Command = require('../../lib/commands/command.js');
const Packet = require('../../lib/packets/packet.js');
const Packets = require('../../lib/packets/index.js');
const { Buffer } = require('node:buffer');
const assert = require('node:assert');
const process = require('node:process');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

class TestUnknownHandshakePacket extends Command {
  constructor(args) {
    super();
    this.args = args;
  }

  start(_, connection) {
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

  writeUnexpectedPacket(_, connection) {
    const length = 6 + this.args.length;
    const buffer = Buffer.allocUnsafe(length);
    const up = new Packet(0, buffer, 0, length);
    up.offset = 4;
    up.writeInt8(0xfd);
    up.writeBuffer(this.args);
    connection.writePacket(up);
    return TestUnknownHandshakePacket.prototype.finish;
  }

  finish(_, connection) {
    connection.end();
    return TestUnknownHandshakePacket.prototype.finish;
  }
}

const server = mysql.createServer((conn) => {
  conn.addCommand(new TestUnknownHandshakePacket(Buffer.alloc(0)));
});

let error;
let uncaughtExceptions = 0;

const portfinder = require('portfinder');
portfinder.getPort((_, port) => {
  server.listen(port);
  const conn = mysql.createConnection({
    port: port,
  });

  conn.on('error', (err) => {
    error = err;

    conn.end();
    server.close();
  });
});

process.on('uncaughtException', (err) => {
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
