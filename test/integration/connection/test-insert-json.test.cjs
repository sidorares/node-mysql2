'use strict';

/**
 * Created by Elijah Melton on 2023.05.03
 * issue#1924: https://github.com/sidorares/node-mysql2/issues/1924
 */

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let result;
let errorCodeInvalidJSON;
let errorNumInvalidJSON;

connection.query('CREATE TEMPORARY TABLE json_test (data JSON)');
connection.query('INSERT INTO json_test VALUES (?)', ['{"k": "v"'], (err) => {
  errorCodeInvalidJSON = err.code;
  errorNumInvalidJSON = err.errno;
});

connection.query('INSERT INTO json_test VALUES (?)', ['{"k": "v"}'], (err) => {
  if (err) throw err;
});

connection.query('SELECT * FROM json_test;', [], (err, res) => {
  if (err) throw err;
  result = res;
  connection.end();
});

process.on('exit', () => {
  assert.equal(errorCodeInvalidJSON, 'ER_INVALID_JSON_TEXT');
  assert.equal(errorNumInvalidJSON, 3140);
  assert.equal(result[0].data.k, 'v');
});
