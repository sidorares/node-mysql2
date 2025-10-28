'use strict';

const { assert } = require('poku');
const mysql = require('../common.test.cjs');
const process = require('node:process');

// planetscale does not support KILL, skipping this test
// https://planetscale.com/docs/reference/mysql-compatibility
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test, planetscale does not support KILL');
  process.exit(0);
}

const pool = mysql.createPool();
const conn = mysql.createConnection({ multipleStatements: true });
pool.config.connectionLimit = 5;

const numSelectToPerform = 10;
const tids = [];
let numSelects = 0;
let killCount = 0;

function kill() {
  setTimeout(() => {
    const id = tids.shift();
    if (typeof id !== 'undefined') {
      // sleep required to give mysql time to close connection,
      // and callback called after connection with id is really closed
      conn.query('kill ?; select sleep(0.05)', [id], (err) => {
        assert.ifError(err);
        killCount++;
        // TODO: this assertion needs to be fixed, after kill
        // connection is removed from _allConnections but not at a point this callback is called
        //
        // assert.equal(pool._allConnections.length, tids.length);
      });
    } else {
      conn.end();
      pool.end();
    }
  }, 5);
}

pool.on('connection', (conn) => {
  tids.push(conn.threadId);
  conn.on('error', () => {
    setTimeout(kill, 5);
  });
});

for (let i = 0; i < numSelectToPerform; i++) {
  pool.query('select 1 as value', (err, rows) => {
    numSelects++;
    assert.ifError(err);
    assert.equal(rows[0].value, 1);

    // after all queries complete start killing connections
    if (numSelects === numSelectToPerform) {
      kill();
    }
  });
}

process.on('exit', () => {
  assert.equal(numSelects, numSelectToPerform);
  assert.equal(killCount, pool.config.connectionLimit);
});
