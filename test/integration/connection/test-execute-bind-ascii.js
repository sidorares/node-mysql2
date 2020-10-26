'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

const table = 'asciitest';

let rows;
connection.query(`DROP TABLE IF EXISTS ${table}`);
connection.query(
  `CREATE TABLE IF NOT EXISTS ${table} (a char (64) ascii not null, b int unsigned not null) character set utf8`
);
connection.query(`INSERT INTO ${table} (a, b) VALUES ('test', 1)`);
connection.query(`INSERT INTO ${table} (a, b) VALUES ('super', 2)`);
connection.execute(
  `SELECT a FROM ${table} WHERE a=? AND b=?`,
  ['test', 1],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ a: 'test' }]);
});
