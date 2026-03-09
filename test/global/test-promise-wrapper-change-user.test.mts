import type { RowDataPacket } from '../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createConnection } from '../../promise.js';
import { config } from '../common.test.mjs';

type CurrentUserRow = RowDataPacket & { 'current_user()': string };

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

await describe('Promise Wrappers: Change User', async () => {
  await it('testChangeUser', async () => {
    const onlyUsername = function (name: string) {
      return name.substring(0, name.indexOf('@'));
    };

    const conn = await createConnection(config);
    await conn.query(
      "CREATE USER IF NOT EXISTS 'changeuser1'@'%' IDENTIFIED BY 'changeuser1pass'"
    );
    await conn.query(
      "CREATE USER IF NOT EXISTS 'changeuser2'@'%' IDENTIFIED BY 'changeuser2pass'"
    );
    await conn.query("GRANT ALL ON *.* TO 'changeuser1'@'%'");
    await conn.query("GRANT ALL ON *.* TO 'changeuser2'@'%'");
    await conn.query('FLUSH PRIVILEGES');

    await conn.changeUser({
      user: 'changeuser1',
      password: 'changeuser1pass',
    });
    const result1 = await conn.query<CurrentUserRow[]>('select current_user()');
    strict.deepEqual(
      onlyUsername(result1[0][0]['current_user()']),
      'changeuser1'
    );

    await conn.changeUser({
      user: 'changeuser2',
      password: 'changeuser2pass',
    });
    const result2 = await conn.query<CurrentUserRow[]>('select current_user()');
    strict.deepEqual(
      onlyUsername(result2[0][0]['current_user()']),
      'changeuser2'
    );

    await conn.changeUser({
      user: 'changeuser1',
      password: 'changeuser1pass',
    });
    const result3 = await conn.query<CurrentUserRow[]>('select current_user()');
    strict.deepEqual(
      onlyUsername(result3[0][0]['current_user()']),
      'changeuser1'
    );

    await conn.changeUser({
      user: config.user,
      password: config.password,
    });

    await conn.query("DROP USER IF EXISTS 'changeuser1'@'%'");
    await conn.query("DROP USER IF EXISTS 'changeuser2'@'%'");

    await conn.end();
  });
});
