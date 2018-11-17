'use strict';

const common = require('../../common');
const connection = common.createConnection();
const connection1 = common.createConnection({ dateStrings: true });
const assert = require('assert');

let rows, rows1, rows2, rows3, rows4, rows5, rows6;

const date = new Date('1990-01-01 08:15:11 UTC');
const datetime = new Date('2010-12-10 14:12:09.019473');

const date1 = new Date('2000-03-03 08:15:11 UTC');
const date2 = '2010-12-10 14:12:09.019473';
const date3 = null;
const date4 = '2010-12-10 14:12:09.123456';
const date5 = '2010-12-10 14:12:09.019';

connection.query(
  'CREATE TEMPORARY TABLE t (d1 DATE, d2 DATETIME(3), d3 DATETIME(6))'
);
connection.query("set time_zone = '+00:00'");
connection.query('INSERT INTO t set d1=?, d2=?, d3=?', [
  date,
  datetime,
  datetime
]);

connection1.query(
  'CREATE TEMPORARY TABLE t (d1 DATE, d2 TIMESTAMP, d3 DATETIME, d4 DATETIME, d5 DATETIME(6), d6 DATETIME(3))'
);
connection1.query('INSERT INTO t set d1=?, d2=?, d3=?, d4=?, d5=?, d6=?', [
  date,
  date1,
  date2,
  date3,
  date4,
  date5
]);

const dateAsStringExpected = [
  {
    d1: '1990-01-01',
    d2: '2000-03-03 08:15:11',
    d3: '2010-12-10 14:12:09',
    d4: null,
    d5: '2010-12-10 14:12:09.123456',
    d6: '2010-12-10 14:12:09.019'
  }
];

connection.execute(
  'select from_unixtime(?) t',
  [(+date).valueOf() / 1000],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
  }
);

connection.query('select from_unixtime(631152000) t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows1 = _rows;
});

connection.query('select * from t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows2 = _rows;
});

connection.execute('select * from t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows3 = _rows;
  connection.end();
});

connection1.query('select * from t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows4 = _rows;
});

connection1.execute('select * from t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows5 = _rows;
});

connection1.execute(
  'select * from t where d6 = ?',
  [new Date(date5)],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows6 = _rows;
    connection1.end();
  }
);

process.on('exit', () => {
  assert.equal(rows[0].t.constructor, Date);
  assert.equal(rows[0].t.getDate(), date.getDate());
  assert.equal(rows[0].t.getHours(), date.getHours());
  assert.equal(rows[0].t.getMinutes(), date.getMinutes());
  assert.equal(rows[0].t.getSeconds(), date.getSeconds());

  assert.equal(rows1[0].t.constructor, Date);
  assert.equal(
    rows1[0].t - new Date('Mon Jan 01 1990 11:00:00 GMT+1100 (EST)'),
    0
  );

  assert.equal(rows2[0].d1.getDate(), date.getDate());
  assert.equal(rows2[0].d2.getTime(), datetime.getTime());
  assert.equal(rows2[0].d3.getTime(), datetime.getTime());

  assert.equal(rows3[0].d1.getDate(), date.getDate());
  assert.equal(rows3[0].d2.getTime(), datetime.getTime());
  assert.equal(rows3[0].d3.getTime(), datetime.getTime());

  assert.deepEqual(rows4, dateAsStringExpected);
  assert.deepEqual(rows5, dateAsStringExpected);

  assert.equal(rows6.length, 1);
});
