'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection();
const { assert } = require('poku');

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
