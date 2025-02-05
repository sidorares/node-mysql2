'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let error = null;

try {
  connection.execute('SELECT ? AS result', [function () {}], () => {});
} catch (err) {
  error = err;
  connection.end();
}

process.on('exit', () => {
  assert.equal(error.name, 'TypeError');
  if (!error.message.match(/function/)) {
    assert.fail("Expected error.message to contain 'function'");
  }
});
