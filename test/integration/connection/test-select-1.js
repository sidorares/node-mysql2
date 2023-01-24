'use strict';

console.log('Hello from bun test', typeof Bun);

const common = require('../../common');

console.log('after import');

const connection = common.createConnection();
connection.on('connect', function(hello) {
  console.log('connect', hello.serverVersion, hello.protocolVersion);
})
console.log('after create connection');
//const assert = require('assert');
connection.query('SELECT 1', (err, _rows, _fields) => {
  console.log('query callback', err, _rows, _fields);
  connection.end();
  console.log('after end connection');
});


/*

let rows = undefined;
let fields = undefined;
connection.query('SELECT 1', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }

  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ 1: 1 }]);
  assert.equal(fields[0].name, '1');
});

*/