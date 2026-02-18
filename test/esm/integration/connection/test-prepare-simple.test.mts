import type { PrepareStatementInfo } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let _stmt1: PrepareStatementInfo | null = null;
const query1 = 'select 1 + ? + ? as test';
const query2 = 'select 1 + 1'; // no parameters
const query3 = 'create temporary table aaa(i int);'; // no parameters, no result columns

connection.prepare(query1, (err1, stmt1) => {
  assert.ifError(err1);
  _stmt1 = stmt1;
  _stmt1.close();
  connection.prepare(query2, (err2, stmt2) => {
    assert.ifError(err2);
    connection.prepare(query3, (err3, stmt3) => {
      assert.ifError(err3);
      stmt2.close();
      stmt3.close();
      connection.end();
    });
  });
});

process.on('exit', () => {
  assert(_stmt1, 'Expected prepared statement');
  if (!_stmt1) {
    return;
  }
  // @ts-expect-error: TODO: implement typings
  assert.equal(_stmt1.query, query1);
  // @ts-expect-error: TODO: implement typings
  assert(_stmt1.id >= 0);
  // @ts-expect-error: TODO: implement typings
  assert.equal(_stmt1.columns.length, 1);
  // @ts-expect-error: TODO: implement typings
  assert.equal(_stmt1.parameters.length, 2);
});
