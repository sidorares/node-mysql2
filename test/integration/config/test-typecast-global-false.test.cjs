'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection({
  typeCast: false,
});

const { assert } = require('poku');

const COL_1_VALUE = 'col v1';
const COL_2_VALUE = 'col v2';

function executeTests(res) {
  assert.equal(res[0].v1.toString('ascii'), COL_1_VALUE);
  assert.equal(res[0].n1, null);
  assert.equal(res[0].v2.toString('ascii'), COL_2_VALUE);
}

connection.query(
  'CREATE TEMPORARY TABLE binpar_null_test (v1 VARCHAR(16) NOT NULL, n1 VARCHAR(16), v2 VARCHAR(16) NOT NULL)',
);
connection.query(
  `INSERT INTO binpar_null_test (v1, n1, v2) VALUES ("${COL_1_VALUE}", NULL, "${COL_2_VALUE}")`,
  (err) => {
    if (err) throw err;
  },
);

connection.execute('SELECT * FROM binpar_null_test', (err, res) => {
  if (err) throw err;
  executeTests(res);
  connection.end();
});
