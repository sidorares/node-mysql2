'use strict';

const common = require('../../common');
const connection = common.createConnection({ dateStrings: true });
const assert = require('assert');

const tableName = 'dates';
const testFields = ['id', 'date', 'name'];
const testRows = [
  [1, '2017-07-26 09:36:42.000', 'John'],
  [2, '2017-07-26 09:36:42.123', 'Jane']
];
const expected = [
  {
    id: 1,
    date: '2017-07-26 09:36:42',
    name: 'John'
  },
  {
    id: 2,
    date: '2017-07-26 09:36:42.123',
    name: 'Jane'
  }
];

let actualRows = null;

function executeTest(err) {
  assert.ifError(err);
  connection.execute(`SELECT * FROM \`${tableName}\``, (err, rows) => {
    assert.ifError(err);
    actualRows = rows;
    connection.end();
  });
}

connection.query(
  [
    `CREATE TEMPORARY TABLE \`${tableName}\` (`,
    ` \`${testFields[0]}\` int,`,
    ` \`${testFields[1]}\` TIMESTAMP(3),`,
    ` \`${testFields[2]}\` varchar(10)`,
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join(' '),
  err => {
    assert.ifError(err);
    connection.query(
      [
        `INSERT INTO \`${tableName}\` VALUES`,
        `(${testRows[0][0]},"${testRows[0][1]}", "${testRows[0][2]}"),`,
        `(${testRows[1][0]},"${testRows[1][1]}", "${testRows[1][2]}")`
      ].join(' '),
      executeTest
    );
  }
);

process.on('exit', () => {
  expected.map((exp, index) => {
    const row = actualRows[index];
    Object.keys(exp).map(key => {
      assert.equal(exp[key], row[key]);
    });
  });
});
