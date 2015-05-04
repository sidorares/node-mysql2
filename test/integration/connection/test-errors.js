var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var onExecuteResultError = undefined;
var onQueryResultError = undefined;
var onExecuteErrorEvent = undefined;
var onQueryErrorEvent = undefined;
var onExecuteErrorEvent1 = undefined;
var onQueryErrorEvent1 = undefined;

connection.execute('error in execute', [], function(err, _rows, _fields) {
  assert.equal(err.errno, 1064);
  assert.equal(err.code, 'ER_PARSE_ERROR');
  if (err) {
    onExecuteResultError = true;
  }
}).on('error', function() {
  onExecuteErrorEvent = true;
});
connection.query('error in query', [], function(err, _rows, _fields) {
  assert.equal(err.errno, 1064);
  assert.equal(err.code, 'ER_PARSE_ERROR');
  if (err) {
    onQueryResultError = true;
  }
}).on('error', function() {
  onQueryErrorEvent = true;
});
connection.execute('error in execute 1', []).on('error', function() {
  onExecuteErrorEvent1 = true;
});
connection.query('error in query 1').on('error', function() {
  onQueryErrorEvent1 = true;
  connection.end();
});


process.on('exit', function() {
  assert.equal(onExecuteResultError, true);
  assert.equal(onQueryResultError, true);
  assert.equal(onExecuteErrorEvent, undefined);
  assert.equal(onQueryErrorEvent, undefined);
  assert.equal(onExecuteErrorEvent1, true);
  assert.equal(onQueryErrorEvent1, true);
});
