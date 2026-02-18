import type { RowDataPacket } from '../../../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('Change User Plugin Auth', async () => {
  const connection = createConnection();
  const onlyUsername = function (name: string) {
    return name.substring(0, name.indexOf('@'));
  };

  connection.query(
    "CREATE USER IF NOT EXISTS 'changeuser1'@'%' IDENTIFIED BY 'changeuser1pass'"
  );
  connection.query(
    "CREATE USER IF NOT EXISTS 'changeuser2'@'%' IDENTIFIED BY 'changeuser2pass'"
  );
  connection.query("GRANT ALL ON *.* TO 'changeuser1'@'%'");
  connection.query("GRANT ALL ON *.* TO 'changeuser2'@'%'");
  connection.query('FLUSH PRIVILEGES');

  await it('should switch users and verify current_user()', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.changeUser(
        {
          user: 'changeuser1',
          password: 'changeuser1pass',
        },
        (err) => {
          if (err) return reject(err);
          connection.query<RowDataPacket[]>(
            'select current_user()',
            (err, rows) => {
              if (err) return reject(err);
              assert.deepEqual(
                onlyUsername(rows[0]['current_user()']),
                'changeuser1'
              );

              connection.changeUser(
                {
                  user: 'changeuser2',
                  password: 'changeuser2pass',
                },
                (err) => {
                  if (err) return reject(err);

                  connection.query<RowDataPacket[]>(
                    'select current_user()',
                    (err, rows) => {
                      if (err) return reject(err);
                      assert.deepEqual(
                        onlyUsername(rows[0]['current_user()']),
                        'changeuser2'
                      );

                      connection.changeUser(
                        {
                          user: 'changeuser1',
                          password: 'changeuser1pass',
                          // @ts-expect-error: TODO: implement typings
                          passwordSha1: Buffer.from(
                            'f961d39c82138dcec42b8d0dcb3e40a14fb7e8cd',
                            'hex'
                          ), // sha1(changeuser1pass)
                        },
                        () => {
                          connection.query<RowDataPacket[]>(
                            'select current_user()',
                            (err, rows) => {
                              if (err) return reject(err);
                              assert.deepEqual(
                                onlyUsername(rows[0]['current_user()']),
                                'changeuser1'
                              );
                              connection.end();
                              resolve();
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});
