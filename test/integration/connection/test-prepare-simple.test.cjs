'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let _stmt1, _stmt2, _stmt3;
const query1 = 'select 1 + ? + ? as test';
const query2 = 'select 1 + 1'; // no parameters
const query3 = 'create temporary table aaa(i int);'; // no parameters, no result columns

connection.prepare(query1, (err1, stmt1) => {
  assert.ifError(err1);
  _stmt1 = stmt1;
  _stmt1.close();
  connection.prepare(query2, (err2, stmt2) => {
    assert.ifError(err2);
    _stmt2 = stmt2;
    connection.prepare(query3, (err3, stmt3) => {
      assert.ifError(err3);
      _stmt3 = stmt3;
      _stmt2.close();
      _stmt3.close();
      connection.end();
    });
  });
});

process.on('exit', () => {
  assert.equal(_stmt1.query, query1);
  assert(_stmt1.id >= 0);
  assert.equal(_stmt1.columns.length, 1);
  assert.equal(_stmt1.parameters.length, 2);
});
