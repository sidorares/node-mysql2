'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

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
