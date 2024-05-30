'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

const testTable = 'neg-ai-test';
const testData = 'test negative ai';

let selectResult, insertResult;

const testNegativeAI = function (err) {
  assert.ifError(err);
  // insert the negative AI
  connection.query(
    `INSERT INTO \`${testTable}\`` +
      ` (id, title) values (-999, "${testData}")`,
    (err, result) => {
      assert.ifError(err);
      insertResult = result;

      // select the row with negative AI
      connection.query(
        `SELECT * FROM \`${testTable}\`` + ` WHERE id = ${result.insertId}`,
        (err, result_) => {
          assert.ifError(err);
          selectResult = result_;
          connection.end();
        },
      );
    },
  );
};

const prepareAndTest = function () {
  connection.query(
    `CREATE TEMPORARY TABLE \`${testTable}\` (` +
      `\`id\` int(11) signed NOT NULL AUTO_INCREMENT,` +
      `\`title\` varchar(255),` +
      `PRIMARY KEY (\`id\`)` +
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
    testNegativeAI,
  );
};

prepareAndTest();

process.on('exit', () => {
  assert.strictEqual(insertResult.insertId, -999);
  assert.strictEqual(selectResult.length, 1);

  assert.equal(selectResult[0].id, String(insertResult.insertId));
  assert.equal(selectResult[0].title, testData);
});
