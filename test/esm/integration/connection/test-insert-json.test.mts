/**
 * Created by Elijah Melton on 2023.05.03
 * issue#1924: https://github.com/sidorares/node-mysql2/issues/1924
 */

import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type JsonRow = RowDataPacket & { data: { k: string } };

const connection = createConnection();

let result: JsonRow[] | undefined;
let errorCodeInvalidJSON: string | undefined;
let errorNumInvalidJSON: number | undefined;

connection.query('CREATE TEMPORARY TABLE json_test (data JSON)');
connection.query('INSERT INTO json_test VALUES (?)', ['{"k": "v"'], (err) => {
  errorCodeInvalidJSON = err?.code;
  errorNumInvalidJSON = err?.errno;
});

connection.query('INSERT INTO json_test VALUES (?)', ['{"k": "v"}'], (err) => {
  if (err) throw err;
});

connection.query<JsonRow[]>('SELECT * FROM json_test;', [], (err, res) => {
  if (err) throw err;
  result = res;
  connection.end();
});

process.on('exit', () => {
  assert.equal(errorCodeInvalidJSON, 'ER_INVALID_JSON_TEXT');
  assert.equal(errorNumInvalidJSON, 3140);
  assert.equal(result?.[0].data.k, 'v');
});
