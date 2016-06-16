var assert = require('assert');
var mysql = require('../common');

var pool = mysql.createPool();
var conn = mysql.createConnection();
pool.config.connectionLimit = 5;

var numSelectToPerform = 10;
var tids = [];
var numSelects = 0;
var killCount = 0;

function kill () {
  setTimeout(function () {
    var id = tids.shift();
    if (typeof id != 'undefined') {
      conn.query('kill ?', id, function (err, res) {
        assert.ifError(err);
        killCount++;
        assert.equal(pool._allConnections.length, tids.length);
      });
    } else {
      conn.end();
      pool.end();
    }
  }, 5);
}

pool.on('connection', function (conn) {
  tids.push(conn.threadId);
  conn.on('error', function (err) {
    setTimeout(kill, 5);
  });
});

for (var i = 0; i < numSelectToPerform; i++) {
  pool.query('select 1 as value', function (err, rows) {
    numSelects++;
    assert.ifError(err);
    assert.equal(rows[0].value, 1);

    // after all queries complete start killing connections
    if (numSelects == numSelectToPerform) {
      kill();
    }
  });
}

process.on('exit', function () {
  assert.equal(numSelects, numSelectToPerform);
  assert.equal(killCount, pool.config.connectionLimit);
});
