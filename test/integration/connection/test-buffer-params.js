'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows = undefined;
let rows1 = undefined;

const buf = Buffer.from([
  0x80,
  0x90,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  100,
  100,
  255,
  255
]);
connection.execute('SELECT HEX(?) as buf', [buf], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
});

connection.query('SELECT HEX(?) as buf', [buf], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows1 = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ buf: buf.toString('hex').toUpperCase() }]);
  assert.deepEqual(rows1, [{ buf: buf.toString('hex').toUpperCase() }]);
});
