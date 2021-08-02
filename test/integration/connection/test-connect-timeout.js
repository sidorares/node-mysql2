'use strict';

const common = require('../../common');
const connection = common.createConnection({ 
  host: '10.255.255.1',
  debug: false,
  connectTimeout: 100, 
});

const assert = require('assert');

connection.query('SELECT sleep(3) as a', (err, res) => {
  assert.equal(res, null);
  assert.ok(err);
  assert.equal(err.code, 'ETIMEDOUT');
  assert.equal(err.message, 'connect ETIMEDOUT');
});

connection.query({ sql: 'SELECT sleep(3) as a' , timeout: 50}, (err, res) => {
  assert.equal(res, null);
  assert.ok(err);
  assert.equal(err.code, 'ETIMEDOUT');
  assert.equal(err.message, 'connect ETIMEDOUT');
});



