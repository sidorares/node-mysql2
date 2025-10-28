'use strict';
const createPool = require('../../common.test.cjs').createPool;
const { assert } = require('poku');

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

const pool = new createPool({
  connectionLimit: 2,
  maxIdle: 1,
  idleTimeout: 500,
  debug: true,
});

let quitCommandReceived = false;
const originalLog = console.log;
console.log = (message) => {
  if (message === 'Add command: Quit') {
    quitCommandReceived = true;
  }
};

pool.getConnection((_err1, connection1) => {
  pool.getConnection((_err2, connection2) => {
    connection1.release();
    connection2.release();

    setTimeout(() => {
      pool.end();
    }, 2000);
  });
});

process.on('exit', () => {
  assert(!quitCommandReceived, 'quit command should not have been received');
  console.log = originalLog;
});
