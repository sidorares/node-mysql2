// This file was modified by Oracle on June 2, 2021.
// The test has been updated to remove all expectations with regards to the
// "columnLength" metadata field.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const mysql = require('../../common.js').createConnection({
  multipleStatements: true
});
const assert = require('assert-diff');
mysql.query('CREATE TEMPORARY TABLE no_rows (test int)');
mysql.query('CREATE TEMPORARY TABLE some_rows (test int)');
mysql.query('INSERT INTO some_rows values(0)');
mysql.query('INSERT INTO some_rows values(42)');
mysql.query('INSERT INTO some_rows values(314149)');

const clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

const rs1 = {
  affectedRows: 0,
  fieldCount: 0,
  insertId: 0,
  serverStatus: 10,
  warningStatus: 0,
  info: '',
  changedRows: 0
};
const rs2 = clone(rs1);
rs2.serverStatus = 2;
const rs3 = clone(rs1);
rs3.serverStatus = 34;

const select1 = [{ '1': '1' }];
const select2 = [{ '2': '2' }];
const fields1 = [
  {
    catalog: 'def',
    characterSet: 63,
    encoding: 'binary',
    type: 8,
    decimals: 0,
    flags: 129,
    name: '1',
    orgName: '',
    orgTable: '',
    schema: '',
    table: ''
  }
];
const nr_fields = [
  {
    catalog: 'def',
    characterSet: 63,
    encoding: 'binary',
    type: 3,
    decimals: 0,
    flags: 0,
    name: 'test',
    orgName: 'test',
    orgTable: 'no_rows',
    schema: mysql.config.database,
    table: 'no_rows'
  }
];

const sr_fields = clone(nr_fields);
sr_fields[0].orgTable = 'some_rows';
sr_fields[0].table = 'some_rows';
const select3 = [{ test: 0 }, { test: 42 }, { test: 314149 }];

const fields2 = clone(fields1);
fields2[0].name = '2';

const tests = [
  ['select * from some_rows', [[select3, rs3], [sr_fields, undefined], 2]], //  select 3 rows
  [
    'SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT; SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS',
    [rs2, undefined, 1]
  ],
  ['set @a = 1', [rs2, undefined, 1]],
  ['set @a = 1; set @b = 2', [rs2, undefined, 1]],
  [
    'select 1; select 2',
    [[select1, select2, rs2], [fields1, fields2, undefined], 3]
  ],
  ['set @a = 1; select 1', [[select1, rs2], [fields1, undefined], 2]],
  ['select 1; set @a = 1', [[select1, rs2], [fields1, undefined], 2]],
  ['select * from no_rows', [[[], rs3], [nr_fields, undefined], 2]], // select 0 rows"
  ['set @a = 1; select * from no_rows', [[[], rs3], [nr_fields, undefined], 2]], // insert + select 0 rows
  ['select * from no_rows; set @a = 1', [[[], rs3], [nr_fields, undefined], 2]], //  select 0 rows + insert
  [
    'set @a = 1; select * from some_rows',
    [[select3, rs3], [sr_fields, undefined], 2]
  ], // insert + select 3 rows
  [
    'select * from some_rows; set @a = 1',
    [[select3, rs3], [sr_fields, undefined], 2]
  ] //  select 3 rows + insert
];

function procedurise(sql) {
  return [
    'DROP PROCEDURE IF EXISTS _as_sp_call;',
    'CREATE PROCEDURE _as_sp_call()',
    'BEGIN',
    `${sql};`,
    'END'
  ].join('\n');
}

function do_test(testIndex) {
  const next = function() {
    if (testIndex + 1 < tests.length) {
      do_test(testIndex + 1);
    } else {
      mysql.end();
    }
  };

  const entry = tests[testIndex];
  let sql = entry[0];
  const expectation = entry[1];
  // prepared statements do not support multiple statements itself, we need to wrap quey in a stored procedure
  const sp = procedurise(sql);
  mysql.query(sp, err => {
    if (err) {
      throw err;
    }

    sql = 'CALL _as_sp_call()'; // this call is allowed with prepared statements, and result contain multiple statements
    let _numResults = 0;
    const textCmd = mysql.query(sql, (err, _rows, _columns) => {
      if (err) {
        throw err;
      }

      const arrOrColumn = function(c) {
        if (Array.isArray(c)) {
          return c.map(arrOrColumn);
        }

        if (typeof c === 'undefined') {
          return void 0;
        }

        const column = c.inspect();
        // "columnLength" is non-deterministic and the display width for integer
        // data types was deprecated on MySQL 8.0.17.
        // https://dev.mysql.com/doc/refman/8.0/en/numeric-type-syntax.html
        delete column.columnLength;

        return column;
      };

      assert.deepEqual(expectation[0], _rows);
      assert.deepEqual(expectation[1], arrOrColumn(_columns));

      const q = mysql.execute(sql);
      let resIndex = 0;
      let rowIndex = 0;
      let fieldIndex = -1;

      function checkRow(row) {
        const index = fieldIndex;
        if (_numResults === 1) {
          assert.equal(index, 0);
          if (row.constructor.name === 'ResultSetHeader') {
            assert.deepEqual(_rows, row);
          } else {
            assert.deepEqual(_rows[rowIndex], row);
          }
        } else {
          if (resIndex !== index) {
            rowIndex = 0;
            resIndex = index;
          }
          if (row.constructor.name === 'ResultSetHeader') {
            assert.deepEqual(_rows[index], row);
          } else {
            assert.deepEqual(_rows[index][rowIndex], row);
          }
        }
        rowIndex++;
      }

      function checkFields(fields) {
        fieldIndex++;
        const index = fieldIndex;
        if (_numResults === 1) {
          assert.equal(index, 0);
          assert.deepEqual(arrOrColumn(_columns), arrOrColumn(fields));
        } else {
          assert.deepEqual(arrOrColumn(_columns[index]), arrOrColumn(fields));
        }
      }

      q.on('result', checkRow);
      q.on('fields', checkFields);
      q.on('end', next);
    });

    textCmd.on('fields', () => {
      _numResults++;
    });
  });
}
do_test(0);
