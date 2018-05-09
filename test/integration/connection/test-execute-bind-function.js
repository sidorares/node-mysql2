var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var error = null;

try {
  connection.execute('SELECT ? AS result', [function () {}], function(err, _rows) { });
} catch (err) {
  error = err
  connection.end();
}

process.on('exit', function() {
  assert.equal(error.name, 'TypeError');
  if (!error.message.match(/function/)) {
    assert.fail('Expected error.message to contain \'function\'')
  }
});
