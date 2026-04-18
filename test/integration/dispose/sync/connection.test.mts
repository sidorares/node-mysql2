import type { Connection, RowDataPacket } from '../../../../index.js';
import { describe, it, skip, strict } from 'poku';
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
  using conn = createConnection();

  it('should be a function', () => {
    strict.strictEqual(typeof conn[Symbol.dispose], 'function');
  });
});

await describe('dispose should end the connection', async () => {
  using conn = createConnection();
  const rows = await query(conn, 'SELECT 1');

  conn[Symbol.dispose]();

  it('should have received the query result', () => {
    strict.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have closed the connection', () => {
    // @ts-expect-error: internal access
    strict.strictEqual(conn._closing, true);
  });
});

await describe('dispose should handle manual destroy before dispose on connection', async () => {
  using conn = createConnection();
  const rows = await query(conn, 'SELECT 1');

  conn.destroy();
  conn[Symbol.dispose]();

  it('should have received the query result', () => {
    strict.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have closed the connection', () => {
    // @ts-expect-error: internal access
    strict.strictEqual(conn._closing, true);
  });
});
