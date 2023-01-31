'use strict';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let result1, result2;

connection.query('SET NAMES koi8r', (err, _ok) => {
  assert.ifError(err);
  result1 = _ok;
});

connection.query('USE mysql', (err, _ok) => {
  assert.ifError(err);
  result2 = _ok;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(result1.stateChanges.systemVariables, {
    character_set_connection: 'koi8r',
    character_set_client: 'koi8r',
    character_set_results: 'koi8r'
  });
  assert.deepEqual(result2.stateChanges.schema, 'mysql');
});
