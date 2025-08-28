'use strict';
const createPool = require('../common.test.cjs').createPool;
const { assert } = require('poku');

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

const defaultPool = new createPool({
  connectionLimit: 2,
  maxIdle: 1,
  idleTimeout: 1000,
  debug: true,
});

defaultPool.getConnection((_err1, connection1) => {
  let quitCommandReceived = false;

  defaultPool.getConnection((_err2, connection2) => {
    const originalLog = console.log;
    console.log = (message) => {
      if (message === 'Add command: Quit') {
        quitCommandReceived = true;
      }
    };
    connection1.release();
    connection2.release();

    setTimeout(() => {
      assert(
        !quitCommandReceived,
        'quit command should not have been received'
      );

      defaultPool.end();
      console.log = originalLog;
    }, 2000);
  });
});

const gracefulEndPool = new createPool({
  connectionLimit: 2,
  maxIdle: 1,
  idleTimeout: 1000,
  debug: true,
  gracefulEnd: true,
});

gracefulEndPool.getConnection((_err1, connection1) => {
  let quitCommandReceived = false;

  gracefulEndPool.getConnection((_err2, connection2) => {
    const originalLog = console.log;
    console.log = (message) => {
      if (message === 'Add command: Quit') {
        quitCommandReceived = true;
      }
    };
    connection1.release();
    connection2.release();

    setTimeout(() => {
      assert(quitCommandReceived, 'quit command should have been received');

      gracefulEndPool.end();
      console.log = originalLog;
    }, 2000);
  });
});
