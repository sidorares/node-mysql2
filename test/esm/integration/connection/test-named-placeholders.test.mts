import type { Pool, RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection, createPool } from '../../common.test.mjs';

type SumRow = RowDataPacket & { sum: number };

await describe('Named Placeholders', async () => {
  const connection = createConnection();

  connection.query(
    [
      'CREATE TEMPORARY TABLE `test_table` (',
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`num1` int(15),',
      '`num2` int(15),',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );

  connection.query('insert into test_table(num1,num2) values(?, 3)', [1]);
  connection.query('insert into test_table(num1,num2) values(3-?, -10)', [5]);
  connection.query(
    'insert into test_table(num1,num2) values(4+?, 4000000-?)',
    [-5, 8000000]
  );
  connection.query(
    'insert into test_table(num1,num2) values(?, ?)',
    [-5, 8000000]
  );

  connection.config.namedPlaceholders = true;

  await it('should handle named placeholders', async () => {
    const result = await new Promise<{
      execRows: RowDataPacket[];
      execSumRows: RowDataPacket[];
      queryRows: RowDataPacket[];
      querySumRows: RowDataPacket[];
      cmdSql: string;
      cmdValues: unknown;
      qCmdSql: string;
      qCmdValues: unknown;
    }>((resolve, reject) => {
      let execRows: RowDataPacket[];
      let execSumRows: RowDataPacket[];
      let queryRows: RowDataPacket[];

      const cmd = connection.execute(
        'SELECT * from test_table where num1 < :numParam and num2 > :lParam',
        { lParam: 100, numParam: 2 },
        (err, rows) => {
          if (err) return reject(err);
          execRows = rows as RowDataPacket[];
        }
      );

      connection.execute('SELECT :a + :a as sum', { a: 2 }, (err, rows) => {
        if (err) return reject(err);
        execSumRows = rows as RowDataPacket[];
      });

      const qCmd = connection.query(
        'SELECT * from test_table where num1 < :numParam and num2 > :lParam',
        { lParam: 100, numParam: 2 },
        (err, rows) => {
          if (err) return reject(err);
          queryRows = rows as RowDataPacket[];
        }
      );

      connection.query('SELECT :a + :a as sum', { a: 2 }, (err, rows) => {
        if (err) return reject(err);
        resolve({
          execRows,
          execSumRows,
          queryRows,
          querySumRows: rows as RowDataPacket[],
          cmdSql: cmd.sql,
          // @ts-expect-error: TODO: implement typings for Query.values
          cmdValues: cmd.values,
          qCmdSql: qCmd.sql,
          // @ts-expect-error: TODO: implement typings for Query.values
          qCmdValues: qCmd.values,
        });
      });
    });

    assert.equal(
      result.cmdSql,
      'SELECT * from test_table where num1 < ? and num2 > ?'
    );
    assert.deepEqual(result.cmdValues, [2, 100]);
    assert.deepEqual(result.execRows, [{ id: 4, num1: -5, num2: 8000000 }]);
    assert.deepEqual(result.execSumRows, [{ sum: 4 }]);

    assert.equal(
      result.qCmdSql,
      'SELECT * from test_table where num1 < 2 and num2 > 100'
    );
    assert.deepEqual(result.qCmdValues, [2, 100]);
    assert.deepEqual(result.queryRows, [{ id: 4, num1: -5, num2: 8000000 }]);
    assert.deepEqual(result.querySumRows, [{ sum: 4 }]);

    const namedSql = connection.format(
      'SELECT * from test_table where num1 < :numParam and num2 > :lParam',
      { lParam: 100, numParam: 2 }
    );
    assert.equal(
      namedSql,
      'SELECT * from test_table where num1 < 2 and num2 > 100'
    );

    const unnamedSql = connection.format(
      'SELECT * from test_table where num1 < ? and num2 > ?',
      [2, 100]
    );
    assert.equal(
      unnamedSql,
      'SELECT * from test_table where num1 < 2 and num2 > 100'
    );
  });

  await it('should handle named placeholders in pool', async () => {
    const pool: Pool = createPool();
    // @ts-expect-error: TODO: implement typings
    pool.config.connectionConfig.namedPlaceholders = true;

    const rows = await new Promise<SumRow[]>((resolve, reject) => {
      pool.query<SumRow[]>('SELECT :a + :a as sum', { a: 2 }, (err, _rows) => {
        if (err) return reject(err);
        resolve(_rows);
      });
    });

    assert.deepEqual(rows, [{ sum: 4 }]);
    pool.end();
  });

  connection.end();
});
