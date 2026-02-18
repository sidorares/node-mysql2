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
    await new Promise<void>((resolve, reject) => {
      const cmd = connection.execute(
        'SELECT * from test_table where num1 < :numParam and num2 > :lParam',
        { lParam: 100, numParam: 2 },
        (err, rows) => {
          if (err) return reject(err);
          assert.deepEqual(rows, [{ id: 4, num1: -5, num2: 8000000 }]);
        }
      );
      assert.equal(
        cmd.sql,
        'SELECT * from test_table where num1 < ? and num2 > ?'
      );
      // @ts-expect-error: TODO: implement typings for Query.values
      assert.deepEqual(cmd.values, [2, 100]);

      connection.execute('SELECT :a + :a as sum', { a: 2 }, (err, rows) => {
        if (err) return reject(err);
        assert.deepEqual(rows, [{ sum: 4 }]);
      });

      const qCmd = connection.query(
        'SELECT * from test_table where num1 < :numParam and num2 > :lParam',
        { lParam: 100, numParam: 2 },
        (err, rows) => {
          if (err) return reject(err);
          assert.deepEqual(rows, [{ id: 4, num1: -5, num2: 8000000 }]);
        }
      );
      assert.equal(
        qCmd.sql,
        'SELECT * from test_table where num1 < 2 and num2 > 100'
      );
      // @ts-expect-error: TODO: implement typings for Query.values
      assert.deepEqual(qCmd.values, [2, 100]);

      connection.query('SELECT :a + :a as sum', { a: 2 }, (err, rows) => {
        if (err) return reject(err);
        assert.deepEqual(rows, [{ sum: 4 }]);
        connection.end();
        resolve();
      });
    });

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

    await new Promise<void>((resolve, reject) => {
      pool.query<SumRow[]>('SELECT :a + :a as sum', { a: 2 }, (err, rows) => {
        pool.end();
        if (err) return reject(err);
        assert.deepEqual(rows, [{ sum: 4 }]);
        resolve();
      });
    });
  });
});
