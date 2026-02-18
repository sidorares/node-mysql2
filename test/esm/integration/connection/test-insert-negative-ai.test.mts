import type { ResultSetHeader, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type NegAIRow = RowDataPacket & { id: number; title: string };

const connection = createConnection();

const testTable = 'neg-ai-test';
const testData = 'test negative ai';

let selectResult: NegAIRow[];
let insertResult: ResultSetHeader;

const testNegativeAI = function (_err: Error | null) {
  assert.ifError(_err);
  // insert the negative AI
  connection.query<ResultSetHeader>(
    `INSERT INTO \`${testTable}\`` +
      ` (id, title) values (-999, "${testData}")`,
    (_err, result) => {
      assert.ifError(_err);
      insertResult = result;

      // select the row with negative AI
      connection.query<NegAIRow[]>(
        `SELECT * FROM \`${testTable}\`` + ` WHERE id = ${result.insertId}`,
        (_err, result_) => {
          assert.ifError(_err);
          selectResult = result_;
          connection.end();
        }
      );
    }
  );
};

const prepareAndTest = function () {
  connection.query(
    `CREATE TEMPORARY TABLE \`${testTable}\` (` +
      `\`id\` int(11) signed NOT NULL AUTO_INCREMENT,` +
      `\`title\` varchar(255),` +
      `PRIMARY KEY (\`id\`)` +
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
    testNegativeAI
  );
};

prepareAndTest();

process.on('exit', () => {
  assert.strictEqual(insertResult.insertId, -999);
  assert.strictEqual(selectResult.length, 1);

  assert.equal(selectResult[0].id, String(insertResult.insertId));
  assert.equal(selectResult[0].title, testData);
});
