'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection();
const { assert } = require('poku');

let error = null;

try {
  connection.execute('SELECT ? AS result', [undefined], () => {});
} catch (err) {
  error = err;
  connection.end();
}

process.on('exit', () => {
  assert.equal(error.name, 'TypeError');
  if (!error.message.match(/undefined/)) {
    assert.fail("Expected error.message to contain 'undefined'");
  }
});
