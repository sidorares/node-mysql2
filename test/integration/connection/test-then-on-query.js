var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var error = true;

var q = connection.query('SELECT 1')
try {
 if (q.then) q.then();
} catch (err) {
 error = false;
}

process.on('exit', function() {
  assert.equal(error, false);
});
 
