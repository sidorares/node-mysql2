'use strict';

const { assert } = require('poku');

const v1 = 'variable len';
const v2 = true;
const v3 = '2024-04-18 15:48:14';
const v4 = '1.23';

function typeCast(field, next) {
  if (field.type === 'TINY') {
    return field.value() === 1;
  }
  if (field.type === 'DATETIME') {
    return new Date(field.value());
  }
  return next();
}

function executeTests(res) {
  const [{ v1: v1Actual, v2: v2Actual, v3: v3Actual, v4: v4Actual }] = res;
  assert.equal(v1Actual, v1);
  assert.equal(v2Actual, v2);
  assert.equal(v3Actual.getTime(), new Date(v3).getTime());
  assert.equal(v4Actual, v4);
}

const common = require('../../common.test.cjs');
const connection = common.createConnection({
  typeCast: false,
});

connection.query(
  `CREATE TEMPORARY TABLE typecast (v1 VARCHAR(16), v2 TINYINT(1), v3 DATETIME, v4 DECIMAL(10, 2))`,
  (err) => {
    if (err) throw err;
  },
);
connection.query(
  `INSERT INTO typecast VALUES ('${v1}', ${v2},'${v3}', ${v4})`,
  (err) => {
    if (err) throw err;
  },
);
connection.execute({ sql: 'SELECT * FROM typecast', typeCast }, (err, res) => {
  if (err) throw err;
  executeTests(res);
  connection.end();
});