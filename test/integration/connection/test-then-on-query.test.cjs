'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let error = true;

const q = connection.query('SELECT 1');
try {
  if (q.then) q.then();
} catch (err) {
  error = false;
}
q.on('end', () => {
  connection.end();
});

process.on('exit', () => {
  assert.equal(error, false);
});
