var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var result1, resul2;

connection.query('SET NAMES koi8r', function(err, _ok) {
  assert.ifError(err);
  result1 = _ok;
});

connection.query('USE mysql', function(err, _ok) {
  assert.ifError(err);
  result2 = _ok;
  connection.end();
});

process.on('exit', function() {
  assert.deepEqual(result1.stateChanges.systemVariables, {
    character_set_connection: 'koi8r',
    character_set_client: 'koi8r',
    character_set_results: 'koi8r'
  });
  assert.deepEqual(result2.stateChanges.schema, 'mysql');
});
