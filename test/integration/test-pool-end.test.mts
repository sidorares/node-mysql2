import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

function timeoutAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

function getConnectionQueueLength(pool: unknown): number {
  // @ts-expect-error: internal access
  return pool.pool._connectionQueue.length;
}

await describe('Pool End', async () => {
  const pool = createPool();

  await it('should handle pool end correctly', async () => {
    await new Promise<void>((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);

        // @ts-expect-error: internal access
        strict(pool._allConnections.length === 1);
        // @ts-expect-error: internal access
        strict(pool._freeConnections.length === 0);

        // emit the end event, so the connection gets removed from the pool
        // @ts-expect-error: internal access
        conn.stream.emit('end');

        // @ts-expect-error: internal access
        strict(pool._allConnections.length === 0);
        // @ts-expect-error: internal access
        strict(pool._freeConnections.length === 0);

        // As the connection has not really ended we need to do this ourselves
        conn.destroy();
        resolve();
      });
    });
  });

  pool.end();
});

await describe('Pool end should close all connections and mark as closed', async () => {
  const pool = createPool();

  await it('should close all connections and mark pool as closed', async () => {
    await new Promise<void>((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);
        conn.release();

        pool.end((endErr) => {
          if (endErr) return reject(endErr);
          resolve();
        });
      });
    });

    // @ts-expect-error: internal access
    strict(pool._closed === true, 'pool should be closed');
  });
});

await describe('Promise Pool End', async () => {
  await it('should reject queued queries when ending a saturated pool', async () => {
    const pool = createPool({
      connectionLimit: 2,
      gracefulEnd: true,
    }).promise();

    const warmedConnections = await Promise.all([
      pool.getConnection(),
      pool.getConnection(),
    ]);

    for (const conn of warmedConnections) {
      conn.release();
    }

    let enqueued = 0;
    const waitForQueuedQueries = new Promise<void>((resolve) => {
      pool.on('enqueue', () => {
        enqueued++;

        if (enqueued === 2) {
          process.nextTick(resolve);
        }
      });
    });

    const queries = [
      pool.query('SELECT SLEEP(2)'),
      pool.query('SELECT SLEEP(2)'),
      pool.query('SELECT SLEEP(2)'),
      pool.query('SELECT SLEEP(2)'),
    ];
    const activeResultsPromise = Promise.allSettled(queries.slice(0, 2));
    const queuedResultsPromise = Promise.allSettled(queries.slice(2));

    await waitForQueuedQueries;

    strict.equal(getConnectionQueueLength(pool), 2);

    const endPromise = pool.end();

    const queuedResults = await Promise.race([
      queuedResultsPromise,
      timeoutAfter(
        1000,
        `timed out waiting for queued queries to settle; queue length=${getConnectionQueueLength(pool)}`
      ),
    ]);

    for (const result of queuedResults) {
      strict.equal(result.status, 'rejected');

      if (result.status === 'rejected') {
        strict.equal(result.reason.message, 'Pool is closed.');
      }
    }

    strict.equal(getConnectionQueueLength(pool), 0);

    const activeResults = await activeResultsPromise;

    for (const result of activeResults) {
      strict.equal(result.status, 'fulfilled');
    }

    await endPromise;
  });
});
