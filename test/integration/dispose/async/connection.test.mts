import type { RowDataPacket } from '../../../../index.js';
import { describe, it, skip, strict } from 'poku';
import { createConnection } from '../../../../promise.js';
import { config } from '../../../common.test.mjs';

if (!('asyncDispose' in Symbol)) {
  skip('Symbol.asyncDispose is not supported in this runtime');
}

await describe('PromiseConnection should implement Symbol.asyncDispose', async () => {
  await using conn = await createConnection(config);

  it('should be a function', () => {
    strict.strictEqual(typeof conn[Symbol.asyncDispose], 'function');
  });
});

await describe('asyncDispose should end the connection', async () => {
  await using conn = await createConnection(config);
  const [rows] = await conn.query<RowDataPacket[]>('SELECT 1');

  await conn[Symbol.asyncDispose]();

  it('should have received the query result', () => {
    strict.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have closed the connection', () => {
    // @ts-expect-error: internal access
    strict.strictEqual(conn.connection._closing, true);
  });
});

await describe('asyncDispose should handle manual destroy before asyncDispose on connection', async () => {
  await using conn = await createConnection(config);
  const [rows] = await conn.query<RowDataPacket[]>('SELECT 1');

  conn.destroy();
  await conn[Symbol.asyncDispose]();

  it('should have received the query result', () => {
    strict.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have closed the connection', () => {
    // @ts-expect-error: internal access
    strict.strictEqual(conn.connection._closing, true);
  });
});
