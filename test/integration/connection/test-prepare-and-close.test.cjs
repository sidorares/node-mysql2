'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

const max = 500;
const start = process.hrtime();
function prepare(i) {
  connection.prepare(`select 1+${i}`, (err, stmt) => {
    assert.ifError(err);
    stmt.close();
    if (!err) {
      if (i > max) {
        const end = process.hrtime(start);
        const ns = end[0] * 1e9 + end[1];
        console.log(`${(max * 1e9) / ns} prepares/sec`);
        connection.end();
        return;
      }
      setTimeout(() => {
        prepare(i + 1);
      }, 2);
      return;
    }
    assert(0, 'Error in prepare!');
  });
}
connection.query('SET GLOBAL max_prepared_stmt_count=10', (err) => {
  assert.ifError(err);
  prepare(1);
});
