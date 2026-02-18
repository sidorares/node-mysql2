import type {
  PoolConnection,
  QueryError,
  RowDataPacket,
} from '../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection, createPool } from '../common.test.mjs';

// planetscale does not support KILL, skipping this test
// https://planetscale.com/docs/reference/mysql-compatibility
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test, planetscale does not support KILL');
  process.exit(0);
}

await describe('Pool Disconnect', async () => {
  await it('should handle pool connection kills correctly', async () => {
    const pool = createPool();
    const conn = createConnection({ multipleStatements: true });
    pool.config.connectionLimit = 5;

    const numSelectToPerform = 10;
    const tids: number[] = [];
    let numSelects = 0;
    let killCount = 0;

    await new Promise<void>((resolve, reject) => {
      function kill() {
        setTimeout(() => {
          const id = tids.shift();
          if (typeof id !== 'undefined') {
            // sleep required to give mysql time to close connection,
            // and callback called after connection with id is really closed
            conn.query('kill ?; select sleep(0.05)', [id], (err) => {
              if (err) return reject(err);
              killCount++;
              // TODO: this assertion needs to be fixed, after kill
              // connection is removed from _allConnections but not at a point this callback is called
              //
              // assert.equal(pool._allConnections.length, tids.length);
            });
          } else {
            // conn.end waits for pending queries to complete,
            // ensuring the last kill callback (killCount++) has fired
            conn.end(() => {
              pool.end();
              resolve();
            });
          }
        }, 5);
      }

      pool.on('connection', (conn: PoolConnection) => {
        tids.push(conn.threadId);
        conn.on('error', () => {
          setTimeout(kill, 5);
        });
      });

      for (let i = 0; i < numSelectToPerform; i++) {
        pool.query(
          'select 1 as value',
          (err: QueryError | null, rows: RowDataPacket[]) => {
            numSelects++;
            if (err) return reject(err);
            assert.equal(rows[0].value, 1);

            // after all queries complete start killing connections
            if (numSelects === numSelectToPerform) {
              kill();
            }
          }
        );
      }
    });

    assert.equal(numSelects, numSelectToPerform);
    assert.equal(killCount, pool.config.connectionLimit);
  });
});
