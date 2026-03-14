import type { RowDataPacket } from '../../promise.js';
import { assert, describe, it } from 'poku';
import BasePool from '../../lib/base/pool.js';
import Pool from '../../lib/pool.js';
import { createPool } from '../common.test.mjs';

await describe('Pool getConnection contract', async () => {
  const pool = createPool({ connectionLimit: 2 });

  it('should not expose _getConnection as a method', () => {
    // @ts-expect-error: testing internal API does not leak
    assert.strictEqual(typeof pool._getConnection, 'undefined');
  });

  it('should expose getConnection as a function', () => {
    assert.strictEqual(typeof pool.getConnection, 'function');
  });

  it('should be an instance of Pool and BasePool', () => {
    assert.ok(pool instanceof Pool, 'pool should be instance of Pool');
    assert.ok(pool instanceof BasePool, 'pool should be instance of BasePool');
  });

  it('should inherit getConnection from the prototype chain', () => {
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(pool, 'getConnection'),
      false,
      'getConnection should not be an own property'
    );
    assert.strictEqual(
      typeof BasePool.prototype.getConnection,
      'function',
      'getConnection should exist on BasePool.prototype'
    );
    assert.strictEqual(
      pool.getConnection,
      BasePool.prototype.getConnection,
      'pool.getConnection should reference BasePool.prototype.getConnection'
    );
  });

  await it('should acquire and release a connection', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);
        conn.query(
          'SELECT 1 AS result',
          (qErr: Error | null, results: RowDataPacket[]) => {
            conn.release();
            if (qErr) return reject(qErr);
            resolve(results);
          }
        );
      });
    });

    assert.strictEqual(rows[0].result, 1);
  });

  await it('should reuse released connections', async () => {
    const [threadId1, threadId2] = await new Promise<[number, number]>(
      (resolve, reject) => {
        pool.getConnection((err, conn1) => {
          if (err) return reject(err);
          const id1 = conn1.threadId;
          conn1.release();

          pool.getConnection((err2, conn2) => {
            if (err2) return reject(err2);
            const id2 = conn2.threadId;
            conn2.release();
            resolve([id1, id2]);
          });
        });
      }
    );

    assert.strictEqual(
      threadId2,
      threadId1,
      'should reuse the same underlying connection'
    );
  });

  await it('should respect connectionLimit', async () => {
    const allConnections = await new Promise<number>((resolve, reject) => {
      pool.getConnection((err, conn1) => {
        if (err) return reject(err);
        pool.getConnection((err2, conn2) => {
          if (err2) {
            conn1.release();
            return reject(err2);
          }

          // @ts-expect-error: accessing internal pool state
          const count = pool._allConnections.length;

          conn1.release();
          conn2.release();
          resolve(count);
        });
      });
    });

    assert.strictEqual(allConnections, 2);
  });

  await pool.promise().end();
});
