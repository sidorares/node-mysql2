var config = require('../common.js').config;

var skipTest = false;
if (typeof Promise == 'undefined') {
  console.log('no Promise support, skipping test');
  skipTest = true;
  process.exit(0);
}

var assert = require('assert');

var createConnection = require('../../promise.js').createConnection;
var createPool = require('../../promise.js').createPool;

// it's lazy exported from main index.js as well. Test that it's same function
var mainExport = require('../../index.js').createConnectionPromise;
assert.equal(mainExport, createConnection);

var doneCalled = false;
var exceptionCaught = false;

var doneCalledPool = false;
var exceptionCaughtPool = false;
var doneEventsPool = false;

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

  console.log('=== 1', connPromise);
  console.log('=== 2', connPromise.end);

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
      console.log(err);
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

function testEventsPool() {
  var pool = createPool(config);
  var events = 0;

  pool
    .once('acquire', function(connection) {
      ++events;
    })
    .once('connection', function(connection) {
      ++events;
    })
    .once('enqueue', function() {
      ++events;
    })
    .once('release', function() {
      ++events;

      doneEventsPool = events === 4;
    });

  pool.pool.emit('acquire');
  pool.pool.emit('connection');
  pool.pool.emit('enqueue');
  pool.pool.emit('release');
}

testBasic();
testErrors();
testObjParams();
testBasicPool();
testErrorsPool();
testObjParamsPool();
testEventsPool();

process.on('exit', function() {
  if (skipTest) {
    return;
  }
  assert.equal(doneCalled, true);
  assert.equal(exceptionCaught, true);
  assert.equal(doneCalledPool, true);
  assert.equal(exceptionCaughtPool, true);
  assert.equal(doneEventsPool, true);
});

process.on('unhandledRejection', function(err) {
  console.log('AAA', err.stack);
});
