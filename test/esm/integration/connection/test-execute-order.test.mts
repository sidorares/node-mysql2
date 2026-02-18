import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute Order', async () => {
  const connection = createConnection();

  await it('should execute queries in order', async () => {
    const order: number[] = [];

    await new Promise<void>((resolve, reject) => {
      connection.execute('select 1+2', (err) => {
        if (err) return reject(err);
        order.push(0);
      });
      connection.execute('select 2+2', (err) => {
        if (err) return reject(err);
        order.push(1);
      });
      connection.query('select 1+1', (err) => {
        if (err) return reject(err);
        order.push(2);
        connection.end();
        resolve();
      });
    });

    assert.deepEqual(order, [0, 1, 2]);
  });
});
