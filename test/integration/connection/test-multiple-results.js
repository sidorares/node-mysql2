// This file was modified by Oracle on June 2, 2021.
// The test has been updated to remove all expectations with regards to the
// "columnLength" metadata field.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

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
  info: ''
};
const rs2 = clone(rs1);
rs2.serverStatus = 2;

const twoInsertResult = [[rs1, rs2], [undefined, undefined], 2];
const select1 = [{ '1': '1' }];
const select2 = [{ '2': '2' }];
const fields1 = [
  {
    catalog: 'def',
    characterSet: 63,
    columnType: 8,
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
    columnType: 3,
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
  ['select * from some_rows', [select3, sr_fields, 1]], //  select 3 rows
  [
    'SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT; SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;',
    twoInsertResult
  ],
  [
    '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;',
    twoInsertResult
  ], // issue #26
  ['set @a = 1', [rs2, undefined, 1]], // one insert result
  ['set @a = 1; set @b = 2', twoInsertResult],
  ['select 1; select 2', [[select1, select2], [fields1, fields2], 2]],
  ['set @a = 1; select 1', [[rs1, select1], [undefined, fields1], 2]],
  ['select 1; set @a = 1', [[select1, rs2], [fields1, undefined], 2]],
  ['select * from no_rows', [[], nr_fields, 1]], // select 0 rows"
  ['set @a = 1; select * from no_rows', [[rs1, []], [undefined, nr_fields], 2]], // insert + select 0 rows
  ['select * from no_rows; set @a = 1', [[[], rs2], [nr_fields, undefined], 2]], //  select 0 rows + insert
  [
    'set @a = 1; select * from some_rows',
    [[rs1, select3], [undefined, sr_fields], 2]
  ], // insert + select 3 rows
  [
    'select * from some_rows; set @a = 1',
    [[select3, rs2], [sr_fields, undefined], 2]
  ] //  select 3 rows + insert
];

// TODO: tests with error in the query with different index
// TODO: multiple results from single query

function do_test(testIndex) {
  const entry = tests[testIndex];
  const sql = entry[0];
  const expectation = entry[1];
  mysql.query(sql, (err, _rows, _columns) => {
    let _numResults = 0;
    if (_rows.constructor.name === 'ResultSetHeader') {
      _numResults = 1;
    } else if (_rows.length === 0) {
      // empty select
      _numResults = 1;
    } else if (_rows.length > 0) {
      if (
        _rows.constructor.name === 'Array'
      ) {
        _numResults = 1;
      }

      if (
        _rows.constructor.name === 'Array' &&
        (_rows[0].constructor.name === 'Array' ||
          _rows[0].constructor.name === 'ResultSetHeader')
      ) {
        _numResults = _rows.length;
      }
    }
    if (err) {
      console.log(err);
      process.exit(-1);
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

    assert.deepEqual(expectation, [_rows, arrOrColumn(_columns), _numResults]);

    const q = mysql.query(sql);
    let resIndex = 0;
    let rowIndex = 0;

    let fieldIndex = -1;

    function checkRow(row) {
      const index = fieldIndex;
      if (_numResults === 1) {
        assert.equal(fieldIndex, 0);
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
      if (_numResults === 1) {
        assert.equal(fieldIndex, 0);
        assert.deepEqual(arrOrColumn(_columns), arrOrColumn(fields));
      } else {
        assert.deepEqual(
          arrOrColumn(_columns[fieldIndex]),
          arrOrColumn(fields)
        );
      }
    }
    q.on('result', checkRow);
    q.on('fields', checkFields);
    q.on('end', () => {
      if (testIndex + 1 < tests.length) {
        do_test(testIndex + 1);
      } else {
        mysql.end();
      }
    });
  });
}
do_test(0);
