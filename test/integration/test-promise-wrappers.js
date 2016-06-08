var config = require('../common.js').config;

var skipTest = false;
if (typeof Promise == 'undefined') {
  console.log('no Promise support, skipping test');
  skipTest = true;
  return;
}

var assert = require('assert');

var createConnection = require('../../promise.js').createConnection;
// it's lazy exported from main index.js as well. Test that it's same function
var mainExport = require('../../index.js').createConnectionPromise;
assert.equal(mainExport, createConnection);

var doneCalled = false;
var exceptionCaught = false;

function testBasic () {
  var connResolved;
  var connPromise = createConnection(config).then(function (conn) {
    connResolved = conn;
    return conn.query('select 1+2 as ttt');
  }).then(function (result1) {
    assert.equal(result1[0][0].ttt, 3);
    return connResolved.query('select 2+2 as qqq');
  }).then(function (result2) {
    assert.equal(result2[0][0].qqq, 4);
    return connResolved.end();
  }).then(function () {
    doneCalled = true;
  }).catch(function (err) {
    throw err;
  });
}

function testErrors () {
  var connResolved;
  var connPromise = createConnection(config).then(function (conn) {
    connResolved = conn;
    return conn.query('select 1+2 as ttt');
  }).then(function (result1) {
    assert.equal(result1[0][0].ttt, 3);
    return connResolved.query('bad sql');
  }).then(function (result2) {
    assert.equal(result1[0][0].ttt, 3);
    return connResolved.query('select 2+2 as qqq');
  }).catch(function (err) {
    exceptionCaught = true;
    return connResolved.end();
  });
}

testBasic();
testErrors();

process.on('exit', function () {
  if (skipTest) {
    return;
  }
  assert.equal(doneCalled, true);
  assert.equal(exceptionCaught, true);
});
