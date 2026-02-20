import type { RowDataPacket } from '../../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert, describe, it, skip } from 'poku';
import { createConnection } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

await describe('Change User', async () => {
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
        { user: 'changeuser1', password: 'changeuser1pass' },
        (err) => (err ? reject(err) : resolve())
      );
    });

    const rows1 = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('select current_user()', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    assert.deepEqual(onlyUsername(rows1[0]['current_user()']), 'changeuser1');

    await new Promise<void>((resolve, reject) => {
      connection.changeUser(
        { user: 'changeuser2', password: 'changeuser2pass' },
        (err) => (err ? reject(err) : resolve())
      );
    });

    const rows2 = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('select current_user()', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    assert.deepEqual(onlyUsername(rows2[0]['current_user()']), 'changeuser2');

    await new Promise<void>((resolve, reject) => {
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
        (err) => (err ? reject(err) : resolve())
      );
    });

    const rows3 = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('select current_user()', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    assert.deepEqual(onlyUsername(rows3[0]['current_user()']), 'changeuser1');
  });

  connection.end();
});
