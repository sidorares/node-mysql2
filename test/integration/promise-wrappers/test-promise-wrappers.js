var config = require('../../common.js').config;
var Buffer = require('safe-buffer').Buffer;

var skipTest = false;
if (typeof Promise == 'undefined') {
  console.log('no Promise support, skipping test');
  skipTest = true;
  process.exit(0);
}

var assert = require('assert');

var createConnection = require('../../../promise.js').createConnection;
var createPool = require('../../../promise.js').createPool;

// it's lazy exported from main index.js as well. Test that it's same function
var mainExport = require('../../../index.js').createConnectionPromise;
assert.equal(mainExport, createConnection);

var doneCalled = false;
var exceptionCaught = false;
var doneEventsConnect = false;

var doneCalledPool = false;
var exceptionCaughtPool = false;
var doneEventsPool = false;
var doneChangeUser = false;

function testBasic() {
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return conn.query('select 1+2 as ttt');
    })
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved.query('select 2+2 as qqq');
    })
    .then(function(result2) {
      assert.equal(result2[0][0].qqq, 4);
      return connResolved.end();
    })
    .then(function() {
      doneCalled = true;
    })
    .catch(function(err) {
      throw err;
    });
}

function testErrors() {
  var connResolved;
  var connPromise = createConnection(config);

  connPromise
    .then(function(conn) {
      connResolved = conn;
      return conn.query('select 1+2 as ttt');
    })
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved.query('bad sql');
    })
    .then(function(result2) {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved.query('select 2+2 as qqq');
    })
    .catch(function(err) {
      exceptionCaught = true;
      if (connResolved) {
        connResolved.end();
      } else {
        console.log('Warning: promise rejected before first query');
      }
    });
}

function testObjParams() {
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return conn.query({
        sql: 'select ?-? as ttt',
        values: [5, 2]
      });
    })
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved.execute({
        sql: 'select ?-? as ttt',
        values: [8, 5]
      });
    })
    .then(function(result2) {
      assert.equal(result2[0][0].ttt, 3);
      return connResolved.end();
    })
    .catch(function(err) {
      console.log(err);
    });
}

function testPrepared() {
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return conn.prepare('select ?-? as ttt, ? as uuu');
    })
    .then(function(statement) {
      return statement.execute([11, 3, 'test']);
    })
    .then(function(result) {
      assert.equal(result[0][0].ttt, 8);
      assert.equal(result[0][0].uuu, 'test');
      return connResolved.end();
    })
    .catch(function(err) {
      console.log(err);
      if (connResolved) {
        connResolved.end();
      } else {
        console.log(
          'Warning: promise rejected before executing prepared statement'
        );
      }
    });
}

function testPreparedError() {
  var connResolved;
  var stmtPrepared;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return conn.prepare('select ?-? as ttt, ? as uuu');
    })
    .then(function(statement) {
      stmtPrepared = statement;
      // This should throw an error prior to execution due to missing parameters
      return statement.execute([11, 3]);
    })
    .catch(function(err) {
      // If this error was thrown prior to the execute, pass it on
      if (!connResolved || !stmtPrepared) throw err;

      assert.equal(err.code, 'ER_WRONG_ARGUMENTS');
    })
    .catch(function(err) {
      // An error here is fatal. Pass it on to the end handler
      return err;
    })
    .then(function(err) {
      if (!stmtPrepared || !connResolved) {
        console.log(
          'Warning: promise rejected before executing prepared statement'
        );
      }

      if (stmtPrepared) {
        stmtPrepared.close();
      }
      if (connResolved) {
        connResolved.end();
      }

      if (err) {
        console.log(err);
      }
    });
}

function testEventsConnect() {
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      var events = 0;

      var expectedListeners = {
        error: 1,
        drain: 0,
        connect: 0,
        enqueue: 0,
        end: 0
      };
      for (var eventName in expectedListeners) {
        assert.equal(
          conn.connection.listenerCount(eventName),
          expectedListeners[eventName],
          eventName
        );
      }

      conn
        .once('error', function() {
          assert.equal(this, conn);
          ++events;
        })
        .once('drain', function() {
          assert.equal(this, conn);
          ++events;
        })
        .once('connect', function() {
          assert.equal(this, conn);
          ++events;
        })
        .once('enqueue', function() {
          assert.equal(this, conn);
          ++events;
        })
        .once('end', function() {
          assert.equal(this, conn);
          ++events;

          doneEventsConnect = events === 5;
        });

      conn.connection.emit('error', new Error());
      conn.connection.emit('drain');
      conn.connection.emit('connect');
      conn.connection.emit('enqueue');
      conn.connection.emit('end');

      expectedListeners.error = 0;
      for (var eventName in expectedListeners) {
        assert.equal(
          conn.connection.listenerCount(eventName),
          expectedListeners[eventName],
          eventName
        );
      }

      conn.end();
    })
    .catch(function(err) {
      console.log(err);
      if (connResolved) {
        connResolved.end();
      } else {
        console.log(
          'Warning: promise rejected before executing prepared statement'
        );
      }
    });
}

function testBasicPool() {
  var pool = createPool(config);
  pool
    .query('select 1+2 as ttt')
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return pool.query('select 2+2 as qqq');
    })
    .then(function(result2) {
      assert.equal(result2[0][0].qqq, 4);
      return pool.end();
    })
    .then(function() {
      doneCalledPool = true;
    })
    .catch(function(err) {
      throw err;
    });
}

function testErrorsPool() {
  var pool = createPool(config);
  pool
    .query('select 1+2 as ttt')
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return pool.query('bad sql');
    })
    .then(function(result2) {
      assert.equal(result1[0][0].ttt, 3);
      return pool.query('select 2+2 as qqq');
    })
    .catch(function(err) {
      exceptionCaughtPool = true;
      return pool.end();
    });
}

function testObjParamsPool() {
  var pool = createPool(config);
  pool
    .query({
      sql: 'select ?-? as ttt',
      values: [5, 2]
    })
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return pool.execute({
        sql: 'select ?-? as ttt',
        values: [8, 5]
      });
    })
    .then(function(result2) {
      assert.equal(result2[0][0].ttt, 3);
      return pool.end();
    })
    .catch(function(err) {
      console.log(err);
    });
}
function testPromiseLibrary() {
  var pool = createPool(config);
  var promise = pool.execute({
	  sql: 'select ?-? as ttt',
	  values: [8, 5]
  });
  promise
    .then(function() {
      assert.ok(promise instanceof pool.Promise);
    })
    .then(function() {
      promise = pool.end();
      assert.ok(promise instanceof pool.Promise);
    })
    .catch(function(err) {
        console.log(err);
    });
}

function testEventsPool() {
  var pool = createPool(config);
  var events = 0;

  var expectedListeners = {
    acquire: 0,
    connection: 0,
    enqueue: 0,
    release: 0
  };
  for (var eventName in expectedListeners) {
    assert.equal(
      pool.pool.listenerCount(eventName),
      expectedListeners[eventName],
      eventName
    );
  }

  pool
    .once('acquire', function() {
      assert.equal(this, pool);
      ++events;
    })
    .once('connection', function() {
      assert.equal(this, pool);
      ++events;
    })
    .once('enqueue', function() {
      assert.equal(this, pool);
      ++events;
    })
    .once('release', function() {
      assert.equal(this, pool);
      ++events;

      doneEventsPool = events === 4;
    });

  pool.pool.emit('acquire');
  pool.pool.emit('connection');
  pool.pool.emit('enqueue');
  pool.pool.emit('release');

  for (var eventName in expectedListeners) {
    assert.equal(
      pool.pool.listenerCount(eventName),
      expectedListeners[eventName],
      eventName
    );
  }
}

function testChangeUser() {
  var onlyUsername = function(name) {
    return name.substring(0, name.indexOf('@'));
  };
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return connResolved.query(
        "GRANT ALL ON *.* TO 'changeuser1'@'%' IDENTIFIED BY 'changeuser1pass'"
      );
    })
    .then(function() {
      return connResolved.query(
        "GRANT ALL ON *.* TO 'changeuser2'@'%' IDENTIFIED BY 'changeuser2pass'"
      );
    })
    .then(function() {
      return connResolved.query('FLUSH PRIVILEGES');
    })
    .then(function() {
      return connResolved.changeUser({
        user: 'changeuser1',
        password: 'changeuser1pass'
      });
    })
    .then(function() {
      return connResolved.query('select current_user()');
    })
    .then(function(result) {
      const rows = result[0];
      assert.deepEqual(onlyUsername(rows[0]['current_user()']), 'changeuser1');
      return connResolved.changeUser({
        user: 'changeuser2',
        password: 'changeuser2pass'
      });
    })
    .then(function() {
      return connResolved.query('select current_user()');
    })
    .then(function(result) {
      const rows = result[0];
      assert.deepEqual(onlyUsername(rows[0]['current_user()']), 'changeuser2');
      return connResolved.changeUser({
        user: 'changeuser1',
        passwordSha1: Buffer.from(
          'f961d39c82138dcec42b8d0dcb3e40a14fb7e8cd',
          'hex'
        ) // sha1(changeuser1pass)
      });
    })
    .then(function() {
      return connResolved.query('select current_user()');
    })
    .then(function(result) {
      const rows = result[0];
      assert.deepEqual(onlyUsername(rows[0]['current_user()']), 'changeuser1');
      doneChangeUser = true;
      return connResolved.end();
    })
    .catch(function(err) {
      if (connResolved) {
        connResolved.end();
      }
      throw err;
    });
}

function timebomb(fuse) {
  var timebomb;

  return {
    arm() {
      timebomb = setTimeout(() => {
        throw new Error(`Timebomb not defused within ${fuse}ms`);
      }, fuse);
    },
    defuse() {
      clearTimeout(timebomb);
    }
  };
}

function testPoolConnectionDestroy() {
  // Only allow one connection
  const options = Object.assign({ connectionLimit: 1 }, config);
  const pool = createPool(options);

  const bomb = timebomb(2000);

  pool
    .getConnection()
    .then(connection => connection.destroy())
    .then(bomb.arm)
    .then(() => pool.getConnection())
    .then(bomb.defuse)
    .then(() => pool.end());
}

testBasic();
testErrors();
testObjParams();
testPrepared();
testEventsConnect();
testBasicPool();
testErrorsPool();
testObjParamsPool();
testEventsPool();
testChangeUser();
testPoolConnectionDestroy();
testPromiseLibrary();

process.on('exit', function() {
  if (skipTest) {
    return;
  }
  assert.equal(doneCalled, true, 'done not called');
  assert.equal(exceptionCaught, true, 'exception not caught');
  assert.equal(doneEventsConnect, true, 'wrong number of connection events');
  assert.equal(doneCalledPool, true, 'pool done not called');
  assert.equal(exceptionCaughtPool, true, 'pool exception not caught');
  assert.equal(doneEventsPool, true, 'wrong number of pool connection events');
  assert.equal(doneChangeUser, true, 'user not changed');
});

process.on('unhandledRejection', function(err) {
  console.log('AAA', err.stack);
});
