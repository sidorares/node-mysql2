import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

await describe('Pool Release', async () => {
  const pool = createPool({
    idleTimeout: 15000,
  });

  await it('should release connections back to the pool', async () => {
    let allConnectionsLength!: number;
    let freeConnectionsLength!: number;
    let connectionQueueLength!: number;

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
                              allConnectionsLength =
                                // @ts-expect-error: internal access
                                pool._allConnections.length;
                              // on some setups with small CLIENT_INTERACTION_TIMEOUT value connection might be closed by the time we get here, hence "one or zero"
                              freeConnectionsLength =
                                // @ts-expect-error: internal access
                                pool._freeConnections.length;
                              connectionQueueLength =
                                // @ts-expect-error: internal access
                                pool._connectionQueue.length;
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

    strict(allConnectionsLength < 3);
    strict(freeConnectionsLength <= 1);
    strict(connectionQueueLength === 0);
  });

  pool.end();
});
