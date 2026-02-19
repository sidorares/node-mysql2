import type { ResultSetHeader, RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type NegAIRow = RowDataPacket & { id: number; title: string };

await describe('Insert Negative Auto Increment', async () => {
  const connection = createConnection();

  const testTable = 'neg-ai-test';
  const testData = 'test negative ai';

  await it('should handle negative auto increment IDs', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query(
        `CREATE TEMPORARY TABLE \`${testTable}\` (` +
          `\`id\` int(11) signed NOT NULL AUTO_INCREMENT,` +
          `\`title\` varchar(255),` +
          `PRIMARY KEY (\`id\`)` +
          `) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
        (err) => (err ? reject(err) : resolve())
      );
    });

    // insert the negative AI
    const insertResult = await new Promise<ResultSetHeader>(
      (resolve, reject) => {
        connection.query<ResultSetHeader>(
          `INSERT INTO \`${testTable}\`` +
            ` (id, title) values (-999, "${testData}")`,
          (err, result) => (err ? reject(err) : resolve(result))
        );
      }
    );

    // select the row with negative AI
    const selectResult = await new Promise<NegAIRow[]>((resolve, reject) => {
      connection.query<NegAIRow[]>(
        `SELECT * FROM \`${testTable}\`` +
          ` WHERE id = ${insertResult.insertId}`,
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    assert.strictEqual(insertResult.insertId, -999);
    assert.strictEqual(selectResult.length, 1);
    assert.equal(selectResult[0].id, String(insertResult.insertId));
    assert.equal(selectResult[0].title, testData);
  });

  connection.end();
});
