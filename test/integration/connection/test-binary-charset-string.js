'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

// TODO - this could be re-enabled
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

let rows = undefined;
let fields = undefined;
let rows1 = undefined;
let fields1 = undefined;
let rows2 = undefined;
let fields2 = undefined;
let rows3 = undefined;
let fields3 = undefined;

let rows4 = undefined;
let fields4 = undefined;
let rows5 = undefined;
let fields5 = undefined;

const query = "SELECT x'010203'";
const query1 = "SELECT '010203'";

connection.query(query, (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  fields = _fields;
});

connection.query(query, (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows5 = _rows;
  fields5 = _fields;
});

connection.query(query1, (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows1 = _rows;
  fields1 = _fields;
});

connection.execute(query, [], (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows2 = _rows;
  fields2 = _fields;
});

// repeat same query - test cached fields and parser
connection.execute(query, [], (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows4 = _rows;
  fields4 = _fields;
});

connection.execute(query1, [], (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows3 = _rows;
  fields3 = _fields;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ "x'010203'": Buffer.from([1, 2, 3]) }]);
  assert.equal(fields[0].name, "x'010203'");
  assert.deepEqual(rows1, [{ '010203': '010203' }]);
  assert.equal(fields1[0].name, '010203');
  assert.deepEqual(rows2, [{ "x'010203'": Buffer.from([1, 2, 3]) }]);
  assert.equal(fields2[0].name, "x'010203'");
  assert.deepEqual(rows3, [{ '010203': '010203' }]);
  assert.equal(fields3[0].name, '010203');

  assert.deepEqual(rows4, [{ "x'010203'": Buffer.from([1, 2, 3]) }]);
  assert.equal(fields4[0].name, "x'010203'");
  assert.deepEqual(rows5, [{ "x'010203'": Buffer.from([1, 2, 3]) }]);
  assert.equal(fields5[0].name, "x'010203'");
});
