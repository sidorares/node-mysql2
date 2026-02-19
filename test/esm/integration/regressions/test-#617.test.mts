import type { QueryError, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

// PlanetScale response has trailing 000 in 2017-07-26 09:36:42.000
// TODO: rewrite test to account for variations. Skipping for now on PS
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('Regression #617', async () => {
  await it('should correctly handle TIMESTAMP(3) with dateStrings', async () => {
    const connection = createConnection({ dateStrings: true });

    const tableName = 'dates';
    const testFields = ['id', 'date', 'name'];
    const testRows = [
      [1, '2017-07-26 09:36:42.000', 'John'],
      [2, '2017-07-26 09:36:42.123', 'Jane'],
    ];
    const expected = [
      {
        id: 1,
        date: '2017-07-26 09:36:42',
        name: 'John',
      },
      {
        id: 2,
        date: '2017-07-26 09:36:42.123',
        name: 'Jane',
      },
    ];

    const actualRows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query(
        [
          `CREATE TEMPORARY TABLE \`${tableName}\` (`,
          ` \`${testFields[0]}\` int,`,
          ` \`${testFields[1]}\` TIMESTAMP(3),`,
          ` \`${testFields[2]}\` varchar(10)`,
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
        ].join(' '),
        (err: QueryError | null) => {
          if (err) return reject(err);
          connection.query(
            [
              `INSERT INTO \`${tableName}\` VALUES`,
              `(${testRows[0][0]},"${testRows[0][1]}", "${testRows[0][2]}"),`,
              `(${testRows[1][0]},"${testRows[1][1]}", "${testRows[1][2]}")`,
            ].join(' '),
            (err: QueryError | null) => {
              if (err) return reject(err);
              connection.execute<RowDataPacket[]>(
                `SELECT * FROM \`${tableName}\``,
                (err, rows) => {
                  if (err) return reject(err);
                  connection.end(() => resolve(rows));
                }
              );
            }
          );
        }
      );
    });

    console.log(actualRows);
    expected.map((exp, index) => {
      const row = actualRows[index];
      Object.keys(exp).map((key) => {
        assert.equal(exp[key as keyof typeof exp], row[key]);
      });
    });
  });
});
