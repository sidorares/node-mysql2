'use strict';

const assert = require('assert');
const common = require('../../common')

const error = new Error('read ECONNRESET');
error.code = 'ECONNRESET'
error.errno = -54
error.syscall = 'read';

const connection = common.createConnection();

// Test that we ignore a ECONNRESET error if the connection
// is already closing, we close and then emit the error
connection.query(`select 1 as "1"`, (err, rows) => {
  assert.equal(rows[0]['1'], 1);
  connection.close();
  connection.stream.emit('error', error);
});

process.on('uncaughtException', err => {
  assert.notEqual(err.code, 'ECONNRESET')
});
