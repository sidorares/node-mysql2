import type { RowDataPacket } from '../../../../index.js';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TestRow = RowDataPacket & { t: number };

const connection = createConnection();

const params = [1, 2];
let query = 'select ? + ?';

function dotest() {
  connection.execute<TestRow[]>(`${query} as t`, params, (err, _rows) => {
    assert.equal(err, null);
    if (params.length < 50) {
      assert.equal(
        _rows[0].t,
        params.reduce((x: number, y: number) => x + y)
      );
      query += ' + ?';
      params.push(params.length);
      dotest();
    } else {
      connection.end();
    }
  });
}

connection.query('SET GLOBAL max_prepared_stmt_count=300', dotest);
