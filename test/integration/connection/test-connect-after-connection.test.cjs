'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let connection2;

connection.once('connect', () => {
  connection.connect((err, _connection) => {
    if (err) {
      throw err;
    }
    connection2 = _connection;
    connection.end();
  });
});

process.on('exit', () => {
  assert.equal(connection, connection2);
});
