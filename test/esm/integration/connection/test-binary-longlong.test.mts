import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type LongLongRow = {
  id: number;
  ls: number | string | null;
  lu: number | string | null;
};

await describe('Binary LongLong', async () => {
  const conn = createConnection();

  conn.query(
    'CREATE TEMPORARY TABLE `tmp_longlong` ( ' +
      ' `id` int(11) NOT NULL AUTO_INCREMENT, ' +
      ' `ls` BIGINT SIGNED, ' +
      ' `lu` BIGINT UNSIGNED, ' +
      ' PRIMARY KEY (`id`) ' +
      ' ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8'
  );

  const values = [
    ['10', '10'],
    ['-11', '11'],
    ['965432100123456789', '1965432100123456789'],
    ['-965432100123456789', '2965432100123456789'],
    [null, null],
  ];

  const bigNums_bnStringsFalse: LongLongRow[] = [
    { id: 1, ls: 10, lu: 10 },
    { id: 2, ls: -11, lu: 11 },
    { id: 3, ls: 965432100123456800, lu: 1965432100123456800 },
    { id: 4, ls: -965432100123456800, lu: 2965432100123457000 },
    { id: 5, ls: null, lu: null },
  ];

  const bigNums_bnStringsTrueFalse: LongLongRow[] = [
    { id: 1, ls: 10, lu: 10 },
    { id: 2, ls: -11, lu: 11 },
    { id: 3, ls: '965432100123456789', lu: '1965432100123456789' },
    { id: 4, ls: '-965432100123456789', lu: '2965432100123456789' },
    { id: 5, ls: null, lu: null },
  ];

  const bigNums_bnStringsTrueTrue: LongLongRow[] = [
    { id: 1, ls: 10, lu: 10 },
    { id: 2, ls: -11, lu: 11 },
    { id: 3, ls: '965432100123456789', lu: '1965432100123456789' },
    { id: 4, ls: '-965432100123456789', lu: '2965432100123456789' },
    { id: 5, ls: null, lu: null },
  ];

  await it('should handle BIGINT values with supportBigNumbers and bigNumberStrings options', async () => {
    await new Promise<void>((resolve, reject) => {
      conn.connect((err) => {
        if (err) return reject(err);

        for (let i = 0; i < values.length; ++i) {
          conn.query('INSERT INTO `tmp_longlong` VALUES (?, ?, ?)', [
            i + 1,
            values[i][0],
            values[i][1],
          ]);
        }
        resolve();
      });
    });

    const results = await new Promise<RowDataPacket[][]>((resolve, reject) => {
      const collected: RowDataPacket[][] = [];
      let completed = 0;
      const total = 6;

      function collectResult(index: number, rows: RowDataPacket[]) {
        collected[index] = rows;
        completed++;
        if (completed === total) resolve(collected);
      }

      function testQuery(
        index: number,
        supportBigNumbers: boolean,
        bigNumberStrings: boolean
      ) {
        conn.query<RowDataPacket[]>(
          {
            sql: 'SELECT * from tmp_longlong',
            // @ts-expect-error: TODO: implement typings
            supportBigNumbers: supportBigNumbers,
            bigNumberStrings: bigNumberStrings,
          },
          (err, rows) => {
            if (err) return reject(err);
            collectResult(index, rows);
          }
        );
      }

      function testExecute(
        index: number,
        supportBigNumbers: boolean,
        bigNumberStrings: boolean
      ) {
        conn.execute<RowDataPacket[]>(
          {
            sql: 'SELECT * from tmp_longlong',
            // @ts-expect-error: TODO: implement typings
            supportBigNumbers: supportBigNumbers,
            bigNumberStrings: bigNumberStrings,
          },
          (err, rows) => {
            if (err) return reject(err);
            collectResult(index, rows);
          }
        );
      }

      testQuery(0, false, false);
      testQuery(1, true, false);
      testQuery(2, true, true);

      testExecute(3, false, false);
      testExecute(4, true, false);
      testExecute(5, true, true);
    });

    assert.deepEqual(results[0], bigNums_bnStringsFalse);
    assert.deepEqual(results[1], bigNums_bnStringsTrueFalse);
    assert.deepEqual(results[2], bigNums_bnStringsTrueTrue);
    assert.deepEqual(results[3], bigNums_bnStringsFalse);
    assert.deepEqual(results[4], bigNums_bnStringsTrueFalse);
    assert.deepEqual(results[5], bigNums_bnStringsTrueTrue);
  });

  conn.end();
});
