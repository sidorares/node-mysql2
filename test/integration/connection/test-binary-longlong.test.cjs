'use strict';

const { assert } = require('poku');
const common = require('../../common.test.cjs');

const conn = common.createConnection();

conn.query(
  'CREATE TEMPORARY TABLE `tmp_longlong` ( ' +
    ' `id` int(11) NOT NULL AUTO_INCREMENT, ' +
    ' `ls` BIGINT SIGNED, ' +
    ' `lu` BIGINT UNSIGNED, ' +
    ' PRIMARY KEY (`id`) ' +
    ' ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8',
);

const values = [
  ['10', '10'],
  ['-11', '11'],
  ['965432100123456789', '1965432100123456789'],
  ['-965432100123456789', '2965432100123456789'],
  [null, null],
];

conn.connect((err) => {
  if (err) {
    console.error(err);
    return;
  }

  for (let i = 0; i < values.length; ++i) {
    conn.query('INSERT INTO `tmp_longlong` VALUES (?, ?, ?)', [
      i + 1,
      values[i][0],
      values[i][1],
    ]);
  }

  const bigNums_bnStringsFalse = [
    { id: 1, ls: 10, lu: 10 },
    { id: 2, ls: -11, lu: 11 },
    { id: 3, ls: 965432100123456800, lu: 1965432100123456800 },
    { id: 4, ls: -965432100123456800, lu: 2965432100123457000 },
    { id: 5, ls: null, lu: null },
  ];

  const bigNums_bnStringsTrueFalse = [
    { id: 1, ls: 10, lu: 10 },
    { id: 2, ls: -11, lu: 11 },
    { id: 3, ls: '965432100123456789', lu: '1965432100123456789' },
    { id: 4, ls: '-965432100123456789', lu: '2965432100123456789' },
    { id: 5, ls: null, lu: null },
  ];

  const bigNums_bnStringsTrueTrue = [
    { id: 1, ls: 10, lu: 10 },
    { id: 2, ls: -11, lu: 11 },
    { id: 3, ls: '965432100123456789', lu: '1965432100123456789' },
    { id: 4, ls: '-965432100123456789', lu: '2965432100123456789' },
    { id: 5, ls: null, lu: null },
  ];

  let completed = 0;
  let started = 0;

  function testQuery(supportBigNumbers, bigNumberStrings, expectation) {
    started++;
    conn.query(
      {
        sql: 'SELECT * from tmp_longlong',
        supportBigNumbers: supportBigNumbers,
        bigNumberStrings: bigNumberStrings,
      },
      (err, rows) => {
        assert.ifError(err);
        assert.deepEqual(rows, expectation);
        completed++;
        if (completed === started) {
          conn.end();
        }
      },
    );
  }

  function testExecute(supportBigNumbers, bigNumberStrings, expectation) {
    started++;
    conn.execute(
      {
        sql: 'SELECT * from tmp_longlong',
        supportBigNumbers: supportBigNumbers,
        bigNumberStrings: bigNumberStrings,
      },
      (err, rows) => {
        assert.ifError(err);
        assert.deepEqual(rows, expectation);
        completed++;
        if (completed === started) {
          conn.end();
        }
      },
    );
  }

  testQuery(false, false, bigNums_bnStringsFalse);
  testQuery(true, false, bigNums_bnStringsTrueFalse);
  testQuery(true, true, bigNums_bnStringsTrueTrue);

  testExecute(false, false, bigNums_bnStringsFalse);
  testExecute(true, false, bigNums_bnStringsTrueFalse);
  testExecute(true, true, bigNums_bnStringsTrueTrue);
});
