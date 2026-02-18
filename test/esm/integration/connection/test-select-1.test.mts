import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Select 1', async () => {
  await it('should query and execute SELECT 1', async () => {
    const connection = createConnection();

    await new Promise<void>((resolve, reject) => {
      connection.query('SELECT 1 as result', (err, rows, fields) => {
        if (err) return reject(err);
        assert.ifError(err);
        assert.deepEqual(rows, [{ result: 1 }]);
        assert.equal(fields[0].name, 'result');

        connection.execute('SELECT 1 as result', (err, rows, fields) => {
          if (err) return reject(err);
          assert.ifError(err);
          assert.deepEqual(rows, [{ result: 1 }]);
          assert.equal(fields[0].name, 'result');

          connection.end((err) => {
            if (err) return reject(err);
            assert.ifError(err);
            resolve();
          });
        });
      });
    });
  });
});
