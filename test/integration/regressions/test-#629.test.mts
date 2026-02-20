import type { QueryError, RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Regression #629', async () => {
  await it('should correctly handle TIMESTAMP(3) and DATETIME(3) with timezone Z', async () => {
    const connection = createConnection({
      dateStrings: false,
      timezone: 'Z',
    });

    const tableName = 'dates';
    const testFields = ['id', 'date1', 'date2', 'name'];
    const testRows = [
      [1, '2017-07-26 09:36:42.000', '2017-07-29 09:22:24.000', 'John'],
      [2, '2017-07-26 09:36:42.123', '2017-07-29 09:22:24.321', 'Jane'],
    ];
    const expected = [
      {
        id: 1,
        date1: new Date('2017-07-26T09:36:42.000Z'),
        date2: new Date('2017-07-29T09:22:24.000Z'),
        name: 'John',
      },
      {
        id: 2,
        date1: new Date('2017-07-26T09:36:42.123Z'),
        date2: new Date('2017-07-29T09:22:24.321Z'),
        name: 'Jane',
      },
    ];

    const actualRows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query(
        [
          `CREATE TEMPORARY TABLE \`${tableName}\` (`,
          ` \`${testFields[0]}\` int,`,
          ` \`${testFields[1]}\` TIMESTAMP(3),`,
          ` \`${testFields[2]}\` DATETIME(3),`,
          ` \`${testFields[3]}\` varchar(10)`,
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
        ].join(' '),
        (err: QueryError | null) => {
          if (err) return reject(err);
          connection.query(
            [
              `INSERT INTO \`${tableName}\` VALUES`,
              `(${testRows[0][0]},"${testRows[0][1]}", "${testRows[0][2]}", "${testRows[0][3]}"),`,
              `(${testRows[1][0]},"${testRows[1][1]}", "${testRows[1][2]}", "${testRows[1][3]}")`,
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

    expected.map((exp, index) => {
      const row = actualRows[index];
      Object.keys(exp).map((key) => {
        if (key.startsWith('date')) {
          assert.equal(+exp[key as keyof typeof exp], +row[key]);
        } else {
          assert.equal(exp[key as keyof typeof exp], row[key]);
        }
      });
    });
  });
});
