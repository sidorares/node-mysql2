'use strict';

const conn = require('../test/common.test.cjs').createConnection({ database: 'mysql' });
conn.query('CREATE DATABASE IF NOT EXISTS test', err => {
  if (err) {
    console.log(err);
    return process.exit(-1);
  }

  conn.end();
});
