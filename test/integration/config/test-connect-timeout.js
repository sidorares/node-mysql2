'use strict';

const common = require('../../common');
const connection = common.createConnection({
  host: 'www.google.com'
});
const assert = require('assert');

let errorCount = 0;
let error = null;

connection.on('error', err => {
  errorCount++;
  error = err;
});

process.on('exit', () => {
  assert.equal(errorCount, 1);
  assert.equal(error.code, 'ETIMEDOUT');
});
