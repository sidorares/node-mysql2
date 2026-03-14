'use strict';

const net = require('net');
const mysql = require('../../index.js');
const Packets = require('../../lib/packets/index.js');

const columns = [
  {
    catalog: 'def',
    schema: 'test',
    table: 'test_table',
    orgTable: 'test_table',
    name: 'beta',
    orgName: 'beta',
    characterSet: 33,
    columnLength: 384,
    columnType: 3,
    flags: 0,
    decimals: 0,
  },
  {
    catalog: 'def',
    schema: 'test',
    table: 'test_table',
    orgTable: 'test_table',
    name: 'beta2',
    orgName: 'beta2',
    characterSet: 33,
    columnLength: 384,
    columnType: 3,
    flags: 0,
    decimals: 0,
  },
];

const row = ['12345', '1237788'];

// Pre-build reply buffers so server I/O is the only variable
const replyCache = {};
function prepareReply(n) {
  if (replyCache[n]) {
    return replyCache[n];
  }
  let length = 0;
  const rsHeader = Packets.ResultSetHeader.toPacket(columns.length);
  length += rsHeader.length();
  const columnPackets = columns.map((column) => {
    const packet = Packets.ColumnDefinition.toPacket(column);
    length += packet.length();
    return packet;
  });
  const eof = Packets.EOF.toPacket();
  length += 2 * eof.length();
  const rowPacket = Packets.TextRow.toPacket(row, 'utf8');
  length += n * rowPacket.length();

  const replyBuffer = Buffer.allocUnsafe(length);
  let offset = 0;
  let id = 1;
  function add(packet) {
    packet.writeHeader(id & 0xff); // sequence ID wraps at 256 per MySQL protocol
    id += 1;
    packet.buffer.copy(replyBuffer, offset);
    offset += packet.length();
  }

  add(rsHeader);
  for (let i = 0; i < columns.length; ++i) add(columnPackets[i]);
  add(eof);
  for (let i = 0; i < n; ++i) add(rowPacket);
  add(eof);

  replyCache[n] = replyBuffer;
  return replyBuffer;
}

// Pre-warm the cache for the row counts used in benchmarks
prepareReply(1);
prepareReply(1000);

let server = null;
let connection = null;

/** Allocate a free TCP port. */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, () => {
      const { port } = s.address();
      s.close((err) => (err ? reject(err) : resolve(port)));
    });
    s.on('error', reject);
  });
}

/** Start the fake MySQL server and connect a client. */
async function setup() {
  const port = await getFreePort();

  server = mysql.createServer((conn) => {
    conn.serverHandshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff,
    });
    // Suppress errors that may occur when the client disconnects during teardown
    conn.on('error', () => {});
    conn.on('query', (query) => {
      // The query string is the requested row count (e.g. "1" or "1000")
      const n = parseInt(query, 10) || 1;
      const buff = prepareReply(n);
      conn.write(buff);
      conn._resetSequenceId();
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      connection = mysql.createConnection({ port });
      // Suppress errors that may occur during teardown (server-side socket close)
      connection.on('error', () => {});
      connection.on('connect', resolve);
    });
  });
}

/** Tear down the client connection and server. */
function teardown() {
  if (connection) {
    connection.end();
    connection = null;
  }
  if (server) {
    server.close();
    server = null;
  }
}

/**
 * Benchmark definitions.
 * Each entry uses `defer: true` so Benchmark.js correctly measures async
 * round-trip time rather than Promise-creation time.
 */
const benchmarks = [
  {
    name: 'Select 1 row x 2 small text columns from fake server',
    defer: true,
    fn(deferred) {
      connection.query('1', (err, rows) => {
        // Read result fields so the JS engine cannot eliminate the query work
        // eslint-disable-next-line no-unused-vars
        const _ = rows[0].beta + rows[0].beta2;
        deferred.resolve();
      });
    },
  },
  {
    name: 'Select 1000 rows x 2 small text columns from fake server',
    defer: true,
    fn(deferred) {
      connection.query('1000', () => deferred.resolve());
    },
  },
];

module.exports = { setup, teardown, benchmarks };
