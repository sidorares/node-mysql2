'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection();
const { assert } = require('poku');

const params = [1, 2];
let query = 'select ? + ?';

function dotest() {
  connection.execute(`${query} as t`, params, (err, _rows) => {
    assert.equal(err, null);
    if (params.length < 50) {
      assert.equal(
        _rows[0].t,
        params.reduce((x, y) => x + y),
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
