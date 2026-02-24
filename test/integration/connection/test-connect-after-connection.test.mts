import type { Connection, QueryError } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Connect After Connection', async () => {
  const connection = createConnection();

  await it('should return same connection on second connect call', async () => {
    let connection2: Connection | undefined;

    await new Promise<void>((resolve, reject) => {
      connection.once('connect', () => {
        connection.connect(
          // @ts-expect-error: TODO: implement typings
          (err: QueryError | null, _connection: Connection) => {
            if (err) return reject(err);
            connection2 = _connection;
            connection.end();
            resolve();
          }
        );
      });
    });

    strict.equal(connection, connection2);
  });
});
