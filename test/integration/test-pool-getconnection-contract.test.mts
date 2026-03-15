import type {
  PoolConnection as PoolConnectionContract,
  RowDataPacket,
} from '../../index.js';
import { assert, describe, it } from 'poku';
import driver from '../../index.js';
import BaseConnection from '../../lib/base/connection.js';
import BasePool from '../../lib/base/pool.js';
import Connection from '../../lib/connection.js';
import PoolConnection from '../../lib/pool_connection.js';
import Pool from '../../lib/pool.js';
import PromiseConnection from '../../lib/promise/connection.js';
import PromisePoolConnection from '../../lib/promise/pool_connection.js';
import promiseDriver from '../../promise.js';
import { config, createPool } from '../common.test.mjs';

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

  it('PoolConnection should derive from Connection (issue #3273)', () => {
    assert.ok(
      PoolConnection.prototype instanceof Connection,
      'PoolConnection.prototype should be instanceof Connection'
    );
    assert.ok(
      PoolConnection.prototype instanceof BaseConnection,
      'PoolConnection.prototype should be instanceof BaseConnection'
    );
  });

  it('should export Connection and PoolConnection as constructors', () => {
    assert.strictEqual(
      typeof driver.Connection,
      'function',
      'driver.Connection should be a constructor'
    );
    assert.strictEqual(
      typeof driver.PoolConnection,
      'function',
      'driver.PoolConnection should be a constructor'
    );
  });

  it('exported PoolConnection should derive from exported Connection (issue #3273)', () => {
    assert.ok(
      driver.PoolConnection.prototype instanceof driver.Connection,
      'driver.PoolConnection.prototype should be instanceof driver.Connection'
    );
  });

  await it('pool connection instance should be instanceof Connection', async () => {
    const conn = await new Promise<PoolConnectionContract>(
      (resolve, reject) => {
        pool.getConnection((err, conn) => {
          if (err) return reject(err);
          resolve(conn);
        });
      }
    );

    assert.ok(
      conn instanceof Connection,
      'conn should be instanceof Connection'
    );
    assert.ok(
      conn instanceof PoolConnection,
      'conn should be instanceof PoolConnection'
    );
    conn.release();
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

await describe('Promise Pool getConnection contract', async () => {
  const pool = createPool({ connectionLimit: 1 });
  const promisePool = pool.promise();

  it('PromisePoolConnection should derive from PromiseConnection', () => {
    assert.ok(
      PromisePoolConnection.prototype instanceof PromiseConnection,
      'PromisePoolConnection.prototype should be instanceof PromiseConnection'
    );
  });

  await it('promise pool connection instance should be instanceof PromiseConnection', async () => {
    const conn = await promisePool.getConnection();

    assert.ok(
      conn instanceof PromiseConnection,
      'conn should be instanceof PromiseConnection'
    );
    assert.ok(
      conn instanceof PromisePoolConnection,
      'conn should be instanceof PromisePoolConnection'
    );
    conn.release();
  });

  it('should export Connection and PoolConnection as constructors', () => {
    assert.strictEqual(
      typeof promiseDriver.Connection,
      'function',
      'promiseDriver.Connection should be a constructor'
    );
    assert.strictEqual(
      typeof promiseDriver.PoolConnection,
      'function',
      'promiseDriver.PoolConnection should be a constructor'
    );
  });

  it('exported PoolConnection should derive from exported Connection', () => {
    assert.ok(
      promiseDriver.PoolConnection.prototype instanceof
        promiseDriver.Connection,
      'promiseDriver.PoolConnection.prototype should be instanceof promiseDriver.Connection'
    );
  });

  await promisePool.end();
});

await describe('Pool getConnection edge cases', async () => {
  await describe('waitForConnections disabled', async () => {
    // createPool helper from common.test.mjs does not forward waitForConnections
    const pool = driver.createPool({
      ...config,
      connectionLimit: 1,
      waitForConnections: false,
    });

    await it('should return error when no connections available', async () => {
      const conn = await pool.promise().getConnection();
      const err = await new Promise<Error | null>((resolve) => {
        pool.getConnection((err2) => {
          resolve(err2 || null);
        });
      });

      conn.release();

      assert.ok(err instanceof Error, 'should receive an error');
      assert.ok(
        (err as Error).message.includes('No connections available'),
        'should indicate no connections available'
      );
    });

    await pool.promise().end();
  });
});

await describe('Pool query error paths', async () => {
  await it('should emit error in event-emitter mode when pool is closed', async () => {
    const closedPool = createPool({ connectionLimit: 1 });
    await closedPool.promise().end();

    const err = await new Promise<Error>((resolve) => {
      const query = closedPool.query('SELECT 1');
      query.on('error', (err: Error) => resolve(err));
    });

    assert.ok(err instanceof Error, 'should receive an error');
    assert.ok(
      err.message.includes('Pool is closed'),
      'should indicate pool is closed'
    );
  });
});

await describe('Pool execute error paths', async () => {
  await it('should return error when pool is closed', async () => {
    const closedPool = createPool({ connectionLimit: 1 });
    await closedPool.promise().end();

    const err = await new Promise<Error | null>((resolve) => {
      closedPool.execute('SELECT 1', (err: Error | null) => {
        resolve(err);
      });
    });

    assert.ok(err instanceof Error, 'should receive an error');
    assert.ok(
      (err as Error).message.includes('Pool is closed'),
      'should indicate pool is closed'
    );
  });

  await describe('synchronous execute error', async () => {
    const pool = createPool({ connectionLimit: 1 });

    await it('should catch synchronous errors from conn.execute()', async () => {
      const err = await new Promise<Error | null>((resolve) => {
        pool.execute('SELECT ?', { invalid: 'object' }, (err: Error | null) => {
          resolve(err);
        });
      });

      assert.ok(err instanceof TypeError, 'should receive a TypeError');
    });

    await pool.promise().end();
  });
});
