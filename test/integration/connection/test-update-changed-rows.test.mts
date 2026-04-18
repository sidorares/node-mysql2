import type { ResultSetHeader } from '../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip(
    'Skipping test for PlanetScale: changedRows is not guaranteed to be present'
  );
}

/**
 * <plusmancn@gmail.com> created at 2016.09.17 15:24:34
 *
 * issue#288: https://github.com/sidorares/node-mysql2/issues/288
 */
await describe('Update Changed Rows', async () => {
  const connection = createConnection();

  connection.query(
    [
      'CREATE TEMPORARY TABLE `changed_rows` (',
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`value` int(5) NOT NULL,',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );
  connection.query('insert into changed_rows(value) values(1)');
  connection.query('insert into changed_rows(value) values(1)');
  connection.query('insert into changed_rows(value) values(2)');
  connection.query('insert into changed_rows(value) values(3)');

  await it('should track changed rows correctly', async () => {
    const result1 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.execute<ResultSetHeader>(
        'update changed_rows set value=1',
        [],
        (err, _result) => (err ? reject(err) : resolve(_result))
      );
    });

    const result2 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.execute<ResultSetHeader>(
        'update changed_rows set value=1',
        [],
        (err, _result) => (err ? reject(err) : resolve(_result))
      );
    });

    strict.equal(result1.affectedRows, 4);
    strict.equal(result1.changedRows, 2);
    strict.equal(result2.affectedRows, 4);
    strict.equal(result2.changedRows, 0);
  });

  connection.end();
});
