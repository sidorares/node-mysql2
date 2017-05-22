const assert = require('assert');
const mysql = require('../common');

const pool = mysql.createPool();
const conn = mysql.createConnection({ multipleStatements: true });
pool.config.connectionLimit = 5;

const numSelectToPerform = 5;
const tids = [];
let numSelects = 0;
let killCount = 0;

function kill() {
  setTimeout(function() {
    const id = tids.shift();
    if (typeof id != 'undefined') {
      // sleep required to give mysql time to close connection,
      // and callback called after connection with id is really closed
      conn.query('kill ?; select sleep(0.05)', id, function(err, res) {
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

conn.on('error', function(err) {
  console.log('Warning: killer connection is disconnected ', conn.threadId);
  console.log('');
  console.log(err);
});

pool.on('connection', function(poolConn) {
  tids.push(conn.threadId);
  console.log(
    'Test connection (supposed to be killed by killer connection)',
    poolConn.threadId
  );
  poolConn.on('error', function(err) {
    setTimeout(kill, 5);
  });
});

for (let i = 0; i < numSelectToPerform; i++) {
  pool.query('select 1 as value', function(err, rows) {
    numSelects++;
    assert.ifError(err);
    assert.equal(rows[0].value, 1);

    // after all queries complete start killing connections
    if (numSelects == numSelectToPerform) {
      kill();
    }
  });
}

process.on('exit', function() {
  assert.equal(numSelects, numSelectToPerform);
  assert.equal(killCount, pool.config.connectionLimit);
});
