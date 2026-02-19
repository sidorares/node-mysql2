// This file was modified by Oracle on June 2, 2021.
// The test has been updated to remove all expectations with regards to the
// "columnLength" metadata field.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

import process from 'node:process';
// @ts-expect-error: no typings available
import assert from 'assert-diff';
import { describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('Multiple Results', async () => {
  const mysql = createConnection({
    multipleStatements: true,
  });
  mysql.query('CREATE TEMPORARY TABLE no_rows (test int)');
  mysql.query('CREATE TEMPORARY TABLE some_rows (test int)');
  mysql.query('INSERT INTO some_rows values(0)');
  mysql.query('INSERT INTO some_rows values(42)');
  mysql.query('INSERT INTO some_rows values(314149)');

  const clone = function <T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T;
  };

  const rs1 = {
    affectedRows: 0,
    fieldCount: 0,
    insertId: 0,
    serverStatus: 10,
    warningStatus: 0,
    info: '',
    changedRows: 0,
  };
  const rs2 = clone(rs1);
  rs2.serverStatus = 2;

  const twoInsertResult = [[rs1, rs2], [undefined, undefined], 2];
  const select1 = [{ 1: '1' }];
  const select2 = [{ 2: '2' }];
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
      table: '',
    },
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
      table: 'no_rows',
    },
  ];
  const sr_fields = clone(nr_fields);
  sr_fields[0].orgTable = 'some_rows';
  sr_fields[0].table = 'some_rows';
  const select3 = [{ test: 0 }, { test: 42 }, { test: 314149 }];

  const fields2 = clone(fields1);
  fields2[0].name = '2';

  const tests: [string, unknown[]][] = [
    ['select * from some_rows', [select3, sr_fields, 1]], //  select 3 rows
    [
      'SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT; SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;',
      twoInsertResult,
    ],
    [
      '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;',
      twoInsertResult,
    ], // issue #26
    ['set @a = 1', [rs2, undefined, 1]], // one insert result
    ['set @a = 1; set @b = 2', twoInsertResult],
    ['select 1; select 2', [[select1, select2], [fields1, fields2], 2]],
    ['set @a = 1; select 1', [[rs1, select1], [undefined, fields1], 2]],
    ['select 1; set @a = 1', [[select1, rs2], [fields1, undefined], 2]],
    ['select * from no_rows', [[], nr_fields, 1]], // select 0 rows"
    [
      'set @a = 1; select * from no_rows',
      [[rs1, []], [undefined, nr_fields], 2],
    ], // insert + select 0 rows
    [
      'select * from no_rows; set @a = 1',
      [[[], rs2], [nr_fields, undefined], 2],
    ], //  select 0 rows + insert
    [
      'set @a = 1; select * from some_rows',
      [[rs1, select3], [undefined, sr_fields], 2],
    ], // insert + select 3 rows
    [
      'select * from some_rows; set @a = 1',
      [[select3, rs2], [sr_fields, undefined], 2],
    ], //  select 3 rows + insert
  ];

  const hasConstructorName = (
    value: unknown
  ): value is { constructor: { name: string } } => {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as { constructor?: { name?: unknown } };
    return typeof candidate.constructor?.name === 'string';
  };

  // TODO: tests with error in the query with different index
  // TODO: multiple results from single query

  await it('should handle multiple result sets', async () => {
    await new Promise<void>((resolve, reject) => {
      function do_test(testIndex: number) {
        const entry = tests[testIndex];
        const sql = entry[0];
        const expectation = entry[1];
        mysql.query(sql, (err, _rows, _columns) => {
          try {
            if (err) throw err;

            const rows = _rows;
            let _numResults = 0;
            if (
              hasConstructorName(rows) &&
              rows.constructor.name === 'ResultSetHeader'
            ) {
              _numResults = 1;
            } else if (Array.isArray(rows) && rows.length === 0) {
              // empty select
              _numResults = 1;
            } else if (Array.isArray(rows) && rows.length > 0) {
              _numResults = 1;
              const first = rows[0];
              if (
                Array.isArray(first) ||
                (hasConstructorName(first) &&
                  first.constructor.name === 'ResultSetHeader')
              ) {
                _numResults = rows.length;
              }
            }

            const arrOrColumn = function (c: unknown): unknown {
              if (Array.isArray(c)) {
                return c.map(arrOrColumn);
              }

              if (typeof c === 'undefined') {
                return void 0;
              }

              // @ts-expect-error: internal access
              const column = c.inspect() as Record<string, unknown>;
              // "columnLength" is non-deterministic and the display width for integer
              // data types was deprecated on MySQL 8.0.17.
              // https://dev.mysql.com/doc/refman/8.0/en/numeric-type-syntax.html
              delete column.columnLength;

              return column;
            };

            assert.deepEqual(expectation, [
              _rows,
              arrOrColumn(_columns),
              _numResults,
            ]);

            const q = mysql.query(sql);
            let resIndex = 0;
            let rowIndex = 0;

            let fieldIndex = -1;

            const multiRows: unknown[] = Array.isArray(_rows) ? _rows : [_rows];

            function checkRow(row: {
              constructor: { name: string };
              [key: string]: unknown;
            }) {
              const index = fieldIndex;
              if (_numResults === 1) {
                assert.equal(fieldIndex, 0);
                if (row.constructor.name === 'ResultSetHeader') {
                  assert.deepEqual(_rows, row);
                } else {
                  assert.deepEqual(multiRows[rowIndex], row);
                }
              } else {
                if (resIndex !== index) {
                  rowIndex = 0;
                  resIndex = index;
                }
                if (row.constructor.name === 'ResultSetHeader') {
                  assert.deepEqual(multiRows[index], row);
                } else {
                  const resultRows = multiRows[index];
                  if (Array.isArray(resultRows)) {
                    assert.deepEqual(resultRows[rowIndex], row);
                  }
                }
              }
              rowIndex++;
            }

            function checkFields(fields: unknown) {
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
            q.on('result', (row) => {
              try {
                // @ts-expect-error: TODO: implement typings: Include `ResultSetHeader` Query.d.ts
                checkRow(row);
              } catch (e) {
                reject(e);
              }
            });
            q.on('fields', (fields) => {
              try {
                checkFields(fields);
              } catch (e) {
                reject(e);
              }
            });
            q.on('end', () => {
              if (testIndex + 1 < tests.length) {
                do_test(testIndex + 1);
              } else {
                resolve();
              }
            });
          } catch (e) {
            reject(e);
          }
        });
      }
      do_test(0);
    });
  });

  mysql.end();
});
