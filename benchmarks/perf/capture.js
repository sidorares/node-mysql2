'use strict';

// Captures the raw server->client byte stream for a query against a real
// server and saves it as a replayable fixture:
//   <name>.bin  - chunks, each prefixed with uint32le length (real socket chunking)
//   <name>.json - metadata needed to replay through the client state machine
// Usage: node capture.js  (captures the standard set, see CAPTURES below)

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('../../promise.js');

const PORT = Number(process.env.MYSQL_PORT || 3308);
const OUT_DIR = path.join(__dirname, 'fixtures');

const CAPTURES = [
  { name: 'select-1-const', sql: 'SELECT 1 + 1 AS solution' },
  {
    name: 'insert-ok',
    sql: "INSERT INTO t_insert (a, b) VALUES (42, 'hello world payload')",
  },
  { name: 'select-1row-10cols', sql: 'SELECT * FROM t_cols10 WHERE id = 500' },
  {
    name: 'select-100rows-10cols',
    sql: 'SELECT * FROM t_cols10 WHERE id <= 100',
  },
  {
    name: 'select-100rows-100cols',
    sql: 'SELECT * FROM t_cols100 WHERE id <= 100',
  },
  { name: 'select-10k-3cols', sql: 'SELECT * FROM t_large WHERE id <= 10000' },
  {
    name: 'select-100k-3cols',
    sql: 'SELECT * FROM t_large WHERE id <= 100000',
  },
  { name: 'select-1m-3cols', sql: 'SELECT * FROM t_large' },
  { name: 'select-100k-dates', sql: 'SELECT * FROM t_dates' },
  { name: 'select-100k-10cols', sql: 'SELECT * FROM t_cols10' },
];

async function captureOne(conn, def) {
  const chunks = [];
  let capturing = false;
  const onData = (data) => {
    if (capturing) {
      chunks.push(Buffer.from(data));
    }
  };
  conn.connection.stream.prependListener('data', onData);
  capturing = true;
  const [rows] = await conn.query(def.sql);
  capturing = false;
  conn.connection.stream.removeListener('data', onData);

  const parts = [];
  for (const c of chunks) {
    const len = Buffer.allocUnsafe(4);
    len.writeUInt32LE(c.length, 0);
    parts.push(len, c);
  }
  fs.writeFileSync(path.join(OUT_DIR, `${def.name}.bin`), Buffer.concat(parts));
  fs.writeFileSync(
    path.join(OUT_DIR, `${def.name}.json`),
    JSON.stringify(
      {
        sql: def.sql,
        rowCount: Array.isArray(rows) ? rows.length : null,
        affectedRows: Array.isArray(rows) ? null : rows.affectedRows,
        serverCapabilityFlags: conn.connection.serverCapabilityFlags,
        clientEncoding: conn.connection.clientEncoding,
        serverVersion: conn.connection._handshakePacket.serverVersion,
        totalBytes: chunks.reduce((a, c) => a + c.length, 0),
        chunkCount: chunks.length,
      },
      null,
      2
    )
  );
  console.log(
    `${def.name}: ${chunks.reduce((a, c) => a + c.length, 0)} bytes in ${chunks.length} chunks, rows=${Array.isArray(rows) ? rows.length : 'n/a'}`
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: PORT,
    user: 'root',
    database: 'test',
  });
  for (const def of CAPTURES) {
    await captureOne(conn, def);
  }
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
