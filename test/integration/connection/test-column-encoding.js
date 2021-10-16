'use strict';

const common = require('../../common');
const connection = common.createConnection().promise();
const assert = require('assert');

// test data stores
const testData = [
  {
    column_charset: 'tis620',
    column_name: '平仮名',
    data: 'กขค',
    result_charset: 'utf8',
  },
  {
    column_charset: 'tis620',
    column_name: '平仮名',
    data: 'กขค',
    result_charset: null,
  },
  {
    column_charset: 'tis620',
    column_name: '平仮名',
    data: 'กขค',
    result_charset: 'utf8',
  },
  {
    column_charset: 'tis620',
    column_name: '平仮名',
    data: 'กขค',
    result_charset: 'utf8mb3',
  },
  {
    column_charset: 'utf16',
    column_name: 'กขค',
    data: 'กขค',
    result_charset: 'tis620',
  },
];

const resultData = [];

(async () => {
  for (let i = 0; i < testData.length; ++i) {
    const entry = testData[i];

    await connection.query('DROP TABLE IF EXISTS `test-charset-encoding2`');
    await connection.query('SET NAMES "utf8mb4"');
    await connection.query(
      'CREATE TABLE IF NOT EXISTS `test-charset-encoding2` ' +
        `( \`${entry.column_name}\` VARCHAR(1000) CHARACTER SET "${entry.column_charset}")`
    );
    await connection.query('INSERT INTO `test-charset-encoding2` values(?)', [
      entry.data,
    ]);
    await connection.query('SET character_set_results = ?', [
      entry.result_charset,
    ]);
    const result = await connection.query(
      'SELECT * from `test-charset-encoding2`'
    );
    resultData.push(result[0][0]);
  }
  connection.end();
  for (let i = 0; i < testData.length; ++i) {
    const data = {};
    data[testData[i].column_name] = testData[i].data;
    assert.deepEqual(resultData[i], data);
  }
})();
