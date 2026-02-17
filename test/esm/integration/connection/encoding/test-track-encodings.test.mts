import type { RowDataPacket } from '../../../../../index.js';
import { assert } from 'poku';
import { createConnection } from '../../../common.test.mjs';

const connection = createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
const text = 'привет, мир';

connection.query('SET character_set_client=koi8r', (err) => {
  assert.ifError(err);
  connection.query<RowDataPacket[]>(
    `SELECT ? as result`,
    [text],
    (err, rows) => {
      assert.ifError(err);
      assert.equal(rows[0].result, text);
      connection.query('SET character_set_client=cp1251', (err) => {
        assert.ifError(err);
        connection.query<RowDataPacket[]>(
          `SELECT ? as result`,
          [text],
          (err, rows) => {
            assert.ifError(err);
            assert.equal(rows[0].result, text);
            connection.end();
          }
        );
      });
    }
  );
});
