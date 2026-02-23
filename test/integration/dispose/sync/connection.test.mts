import type { Connection, RowDataPacket } from '../../../../index.js';
import { assert, describe, it, skip } from 'poku';
import { createConnection } from '../../../common.test.mjs';

if (!('dispose' in Symbol)) {
  skip('Symbol.dispose is not supported in this runtime');
}

const query = (conn: Connection, sql: string) =>
  new Promise<RowDataPacket[]>((resolve, reject) => {
    conn.query<RowDataPacket[]>(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

await describe('Connection should implement Symbol.dispose', async () => {
  const conn = createConnection();

  it('should be a function', () => {
    assert.strictEqual(typeof conn[Symbol.dispose], 'function');
  });

  conn.end();
});

await describe('dispose should end the connection', async () => {
  const conn = createConnection();
  const rows = await query(conn, 'SELECT 1');

  conn[Symbol.dispose]();

  it('should have received the query result', () => {
    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have closed the connection', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(conn._closing, true);
  });
});

await describe('dispose should handle destroy before dispose on connection', async () => {
  const conn = createConnection();
  const rows = await query(conn, 'SELECT 1');

  conn.destroy();
  conn[Symbol.dispose]();

  it('should have received the query result', () => {
    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have closed the connection', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(conn._closing, true);
  });
});
