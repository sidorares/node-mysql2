'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection();

const max = 500;
function exec(i) {
  const query = `select 1+${i}`;
  connection.execute(query, (err) => {
    connection.unprepare(query);
    if (err) {
      throw err;
    }
    if (i > max) {
      connection.end();
    } else {
      exec(i + 1);
    }
  });
}
connection.query('SET GLOBAL max_prepared_stmt_count=10', (err) => {
  if (err) {
    throw err;
  }
  exec(1);
});
