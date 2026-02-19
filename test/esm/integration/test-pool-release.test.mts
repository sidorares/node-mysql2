import { assert, describe, it } from 'poku';
import { createPool } from '../common.test.mjs';

await describe('Pool Release', async () => {
  await it('should release connections back to the pool', async () => {
    const pool = createPool({
      idleTimeout: 15000,
    });

    await new Promise<void>((resolve) => {
      pool.query('test sql', () => {
        pool.query('test sql', [], () => {
          pool.query('test sql', [], () => {
            pool.query('test sql', [], () => {
              pool.query('test sql', () => {
                pool.query('test sql').on('error', () => {
                  pool.query('test sql', () => {
                    pool.execute('test sql', () => {
                      pool.execute('test sql', () => {
                        pool.execute('test sql', [], () => {
                          pool.execute('test sql', () => {
                            pool.execute('test sql', () => {
                              // TODO change order events are fires so that connection is released before callback
                              // that way this number will be more deterministic
                              // @ts-expect-error: internal access
                              assert(pool._allConnections.length < 3);
                              // on some setups with small CLIENT_INTERACTION_TIMEOUT value connection might be closed by the time we get here, hence "one or zero"
                              // @ts-expect-error: internal access
                              assert(pool._freeConnections.length <= 1);
                              // @ts-expect-error: internal access
                              assert(pool._connectionQueue.length === 0);
                              pool.end();
                              resolve();
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
