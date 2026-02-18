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
        (_err) => {
          if (_err) return reject(_err);
          // insert the negative AI
          connection.query<ResultSetHeader>(
            `INSERT INTO \`${testTable}\`` +
              ` (id, title) values (-999, "${testData}")`,
            (_err, insertResult) => {
              if (_err) return reject(_err);

              // select the row with negative AI
              connection.query<NegAIRow[]>(
                `SELECT * FROM \`${testTable}\`` +
                  ` WHERE id = ${insertResult.insertId}`,
                (_err, selectResult) => {
                  if (_err) return reject(_err);

                  assert.strictEqual(insertResult.insertId, -999);
                  assert.strictEqual(selectResult.length, 1);
                  assert.equal(
                    selectResult[0].id,
                    String(insertResult.insertId)
                  );
                  assert.equal(selectResult[0].title, testData);

                  connection.end();
                  resolve();
                }
              );
            }
          );
        }
      );
    });
  });
});
