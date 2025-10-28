'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let rows = undefined;
let rows1 = undefined;
let rows2 = undefined;

const q = 'select 1 + ? as test';
const key = `undefined/undefined/undefined${q}`;

connection.execute(q, [123], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.execute(q, [124], (err, _rows) => {
    if (err) {
      throw err;
    }
    rows1 = _rows;
    connection.execute(q, [125], (err, _rows) => {
      if (err) {
        throw err;
      }
      rows2 = _rows;
      assert(connection._statements.size === 1);
      assert(connection._statements.get(key).query === q);
      assert(connection._statements.get(key).parameters.length === 1);
      connection.end();
    });
  });
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ test: 124 }]);
  assert.deepEqual(rows1, [{ test: 125 }]);
  assert.deepEqual(rows2, [{ test: 126 }]);
});
