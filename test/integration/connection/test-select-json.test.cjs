'use strict';

/**
 * Created by Alexander Panko <god@panki.ru> on 2016.09.23 18:02
 * issue#409: https://github.com/sidorares/node-mysql2/issues/409
 */
const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let textFetchedRows = undefined;
let binaryFetchedRows = undefined;

const face = '\uD83D\uDE02';

connection.query('CREATE TEMPORARY TABLE json_test (json_test JSON)');
connection.query('INSERT INTO json_test VALUES (?)', JSON.stringify(face));
connection.query('SELECT * FROM json_test', (err, _rows) => {
  if (err) {
    throw err;
  }
  textFetchedRows = _rows;
  connection.execute('SELECT * FROM json_test', (err, _rows) => {
    if (err) {
      throw err;
    }
    binaryFetchedRows = _rows;
    connection.end();
  });
});

process.on('exit', () => {
  assert.equal(textFetchedRows[0].json_test, face);
  assert.equal(binaryFetchedRows[0].json_test, face);
});
