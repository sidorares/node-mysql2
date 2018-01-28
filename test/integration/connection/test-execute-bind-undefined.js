var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var error = null;
var foo = {};

connection.execute('SELECT ? AS result', [foo.bar], function(err, _rows) { });

// TODO: Needs to be a better way of catching this exception
process.on('uncaughtException', (err) => {
  error = err;
  process.exit(0);
});

process.on('exit', function() {
  assert.equal(error.name, 'TypeError');
});
