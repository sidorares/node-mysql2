'use strict';

// Replays a captured server byte stream through the real client receive path
// (PacketParser -> command state machine -> row parsers) with a stubbed
// connection, isolating client CPU from server/network.
//
// Usage: node replay.js <fixture> [chunkMode]
//   chunkMode: "captured" (default, real socket chunk boundaries),
//              "whole" (single buffer), or a number of bytes (e.g. 16384)

const fs = require('node:fs');
const path = require('node:path');
const PacketParser = require('../../lib/packet_parser.js');
const QueryCommand = require('../../lib/commands/query.js');
const ConnectionConfig = require('../../lib/connection_config.js');
const { benchAsync } = require('./helpers.js');

const OUT_DIR = path.join(__dirname, 'fixtures');

function loadFixture(name) {
  const meta = JSON.parse(
    fs.readFileSync(path.join(OUT_DIR, `${name}.json`), 'utf8')
  );
  const raw = fs.readFileSync(path.join(OUT_DIR, `${name}.bin`));
  const chunks = [];
  let off = 0;
  while (off < raw.length) {
    const len = raw.readUInt32LE(off);
    off += 4;
    chunks.push(raw.subarray(off, off + len));
    off += len;
  }
  return { meta, chunks, whole: Buffer.concat(chunks) };
}

function rechunk(whole, size) {
  const chunks = [];
  for (let off = 0; off < whole.length; off += size) {
    chunks.push(whole.subarray(off, off + size));
  }
  return chunks;
}

function makeFakeConnection(meta, queryOptions = {}) {
  const config = new ConnectionConfig({
    host: 'localhost',
    user: 'root',
    database: 'test',
    ...queryOptions.config,
  });
  return {
    config,
    clientEncoding: meta.clientEncoding,
    serverCapabilityFlags: meta.serverCapabilityFlags,
    _mariadbExtendedMetadata: false,
    _handshakePacket: {},
    writePacket() {},
    _resetSequenceId() {},
    protocolError(message) {
      throw new Error(`protocolError: ${message}`);
    },
  };
}

// One replay = one full query lifecycle over the captured bytes.
function replayOnce(meta, chunks, queryOptions) {
  return new Promise((resolve, reject) => {
    const fakeConn = makeFakeConnection(meta, queryOptions);
    const cmd = new QueryCommand(
      { sql: meta.sql, ...queryOptions },
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
    cmd.execute(null, fakeConn); // start(): "sends" the query, arms the state machine
    const parser = new PacketParser((p) => cmd.execute(p, fakeConn));
    for (let i = 0; i < chunks.length; i++) {
      parser.execute(chunks[i]);
    }
  });
}

async function main() {
  const name = process.argv[2];
  const chunkMode = process.argv[3] || 'captured';
  const rowsAsArray = process.argv.includes('--rows-as-array');
  if (!name) {
    console.error(
      'Usage: node replay.js <fixture> [captured|whole|<bytes>] [--rows-as-array]'
    );
    process.exit(1);
  }
  const { meta, chunks, whole } = loadFixture(name);
  let replayChunks;
  if (chunkMode === 'captured') {
    replayChunks = chunks;
  } else if (chunkMode === 'whole') {
    replayChunks = [whole];
  } else {
    replayChunks = rechunk(whole, Number(chunkMode));
  }
  const queryOptions = rowsAsArray ? { rowsAsArray: true } : {};

  // correctness check
  const rows = await replayOnce(meta, replayChunks, queryOptions);
  const gotRows = Array.isArray(rows) ? rows.length : null;
  if (meta.rowCount !== null && gotRows !== meta.rowCount) {
    throw new Error(
      `row count mismatch: expected ${meta.rowCount}, got ${gotRows}`
    );
  }

  const mbPerReplay = meta.totalBytes / 1048576;
  const result = await benchAsync(
    `replay:${name}:${chunkMode}${rowsAsArray ? ':arrays' : ''}`,
    () => replayOnce(meta, replayChunks, queryOptions),
    { minMs: Number(process.env.BENCH_MS || 3000) }
  );
  const rowsPerSec = meta.rowCount ? result.opsPerSec * meta.rowCount : null;
  console.log(
    `  -> ${(result.opsPerSec * mbPerReplay).toFixed(1)} MB/s` +
      (rowsPerSec ? `, ${(rowsPerSec / 1e6).toFixed(2)}M rows/s` : '')
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
