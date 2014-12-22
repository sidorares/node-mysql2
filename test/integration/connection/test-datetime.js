var common      = require('../../common');
var connection  = common.createConnection();
var connection1 = common.createConnection({ dateStrings: true });
var assert      = require('assert');

var rows, rows1, rows2, rows3, rows4, rows5;

var date = new Date('1990-01-01 08:15:11 UTC');
var date1 = new Date('2000-03-03 08:15:11 UTC');
var date2 = '2010-12-10 14:12:09.019473';
connection.query('CREATE TEMPORARY TABLE t (d1 DATE)');
connection.query('INSERT INTO t set d1=?', [date]);

connection1.query('CREATE TEMPORARY TABLE t (d1 DATE, d2 TIMESTAMP, d3 DATETIME)');
connection1.query('INSERT INTO t set d1=?, d2=?, d3=?', [date, date1, date2]);

var dateAsStringExpected = [
     { d1: '1990-01-01',
       d2: '2000-03-03 08:15:11',
       d3: '2010-12-10 14:12:09' } ];


connection.execute('select from_unixtime(?) t', [(+date).valueOf()/1000], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
});

connection.query('select from_unixtime(631152000) t', function(err, _rows, _fields) {
  if (err) throw err;
  rows1 = _rows;
});

connection.query('select * from t', function(err, _rows, _fields) {
  if (err) throw err;
  rows2 = _rows;
});

connection.execute('select * from t', function(err, _rows, _fields) {
  if (err) throw err;
  rows3 = _rows;
  connection.end();
});

connection1.query('select * from t', function(err, _rows, _fields) {
  console.log(_rows);
  if (err) throw err;
  rows4 = _rows;
});

connection1.execute('select * from t', function(err, _rows, _fields) {
  console.log(_rows);
  if (err) throw err;
  rows5 = _rows;
  connection1.end();
});

process.on('exit', function() {
  assert.equal(rows[0].t.constructor, Date);
  assert.equal(rows[0].t.getDate(), date.getDate());
  assert.equal(rows[0].t.getHours(), date.getHours());
  assert.equal(rows[0].t.getMinutes(), date.getMinutes());
  assert.equal(rows[0].t.getSeconds(), date.getSeconds());

  assert.equal(rows1[0].t.constructor, Date);
  assert.equal(rows1[0].t - new Date('Mon Jan 01 1990 11:00:00 GMT+1100 (EST)'), 0);

  assert.equal(rows2[0].d1.getDate(), date.getDate());
  assert.equal(rows3[0].d1.getDate(), date.getDate());

  assert.deepEqual(rows4, dateAsStringExpected);
  assert.deepEqual(rows5, dateAsStringExpected);
});
