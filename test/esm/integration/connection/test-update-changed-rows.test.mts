import type { ResultSetHeader } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

// "changedRows" is not part of the mysql protocol and extracted from "info string" response
// while valid for most mysql servers, it's not guaranteed to be present in all cases
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
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
    await new Promise<void>((resolve, reject) => {
      let result1: ResultSetHeader;
      let result2: ResultSetHeader;

      connection.execute<ResultSetHeader>(
        'update changed_rows set value=1',
        [],
        (err, _result) => {
          if (err) return reject(err);

          result1 = _result;
          connection.execute<ResultSetHeader>(
            'update changed_rows set value=1',
            [],
            (err, _result) => {
              if (err) return reject(err);

              result2 = _result;

              assert.equal(result1.affectedRows, 4);
              assert.equal(result1.changedRows, 2);
              assert.equal(result2.affectedRows, 4);
              assert.equal(result2.changedRows, 0);

              connection.end();
              resolve();
            }
          );
        }
      );
    });
  });
});
