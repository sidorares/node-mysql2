'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let error = true;

const q = connection.query('SELECT 1');
try {
  if (q.then) q.then();
} catch (err) {
  error = false;
}
q.on('end', function() {
  connection.destroy();
});

process.on('exit', function() {
  assert.equal(error, false);
});
