import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

connection.query('SELECT 1 as result', (err, rows, fields) => {
  assert.ifError(err);
  assert.deepEqual(rows, [{ result: 1 }]);
  assert.equal(fields[0].name, 'result');

  connection.execute('SELECT 1 as result', (err, rows, fields) => {
    assert.ifError(err);
    assert.deepEqual(rows, [{ result: 1 }]);
    assert.equal(fields[0].name, 'result');

    connection.end((err) => {
      assert.ifError(err);
      process.exit(0);
    });
  });
});
