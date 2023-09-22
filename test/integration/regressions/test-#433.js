'use strict';

// TODO: reach out to PlanetScale to clarify charset support
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const common = require('../../common');
const connection = common.createConnection({ charset: 'KOI8R_GENERAL_CI' });
const assert = require('assert');

const tableName = 'МояТаблица';
const testFields = ['поле1', 'поле2', 'поле3', 'поле4'];
const testRows = [['привет', 'мир', 47, 7], ['ура', 'тест', 11, 108]];

let actualRows = null;
let actualError = null;

function executeErrorMessageTest() {
  // tableName does not have closing "`", we do this to have tableName in error string
  // it is sent back in original encoding (koi8r), we are testing that it's decoded correctly
  connection.query(`SELECT * FROM \`${tableName}`, err => {
    actualError = err.message;
    connection.end();
  });
}

function executeTest(err) {
  assert.ifError(err);
  connection.query(`SELECT * FROM \`${tableName}\``, (err, rows) => {
    assert.ifError(err);
    actualRows = rows;
    executeErrorMessageTest();
  });
}

connection.query(
  [
    `CREATE TEMPORARY TABLE \`${tableName}\` (`,
    ` \`${testFields[0]}\` varchar(255) NOT NULL,`,
    ` \`${testFields[1]}\` varchar(255) NOT NULL,`,
    ` \`${testFields[2]}\` int(11) NOT NULL,`,
    ` \`${testFields[3]}\` int(11) NOT NULL,`,
    ` PRIMARY KEY (\`${testFields[0]}\`)`,
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join(' '),
  err => {
    assert.ifError(err);
    connection.query(
      [
        `INSERT INTO \`${tableName}\` VALUES`,
        `("${testRows[0][0]}","${testRows[0][1]}", ${testRows[0][2]}, ${testRows[0][3]}),`,
        `("${testRows[1][0]}","${testRows[1][1]}", ${testRows[1][2]}, ${testRows[1][3]})`
      ].join(' '),
      executeTest
    );
  }
);

/* eslint quotes: 0 */
const expectedError =
  "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '`МояТаблица' at line 1";

process.on('exit', () => {
  testRows.map((tRow, index) => {
    const cols = testFields;
    const aRow = actualRows[index];
    assert.equal(aRow[cols[0]], tRow[0]);
    assert.equal(aRow[cols[1]], tRow[1]);
    assert.equal(aRow[cols[2]], tRow[2]);
    assert.equal(aRow[cols[3]], tRow[3]);
  });

  assert.equal(actualError, expectedError);
});
