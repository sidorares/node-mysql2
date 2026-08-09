import type { PoolConnection, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createPool } from '../../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

await describe('Pool: changeUser() isolation', async () => {
  const pool = createPool({ connectionLimit: 1 });

  const onlyUsername = (name: string) => name.substring(0, name.indexOf('@'));

  const getConnection = () =>
    new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, connection) =>
        err ? reject(err) : resolve(connection)
      );
    });

  const currentUser = (connection: PoolConnection) =>
    new Promise<string>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        'SELECT CURRENT_USER() AS `user`',
        (err, rows) => (err ? reject(err) : resolve(onlyUsername(rows[0].user)))
      );
    });

  const admin = pool.promise();

  await admin.query(
    "CREATE USER IF NOT EXISTS 'pooluser1'@'%' IDENTIFIED BY 'pooluser1pass'"
  );
  await admin.query("GRANT SELECT ON *.* TO 'pooluser1'@'%'");
  await admin.query('FLUSH PRIVILEGES');

  await it('keeps the pool user for connections created later', async () => {
    const first = await getConnection();
    const poolUser = await currentUser(first);

    await new Promise<void>((resolve, reject) => {
      first.changeUser(
        { user: 'pooluser1', password: 'pooluser1pass' },
        (err) => (err ? reject(err) : resolve())
      );
    });

    strict.strictEqual(await currentUser(first), 'pooluser1');

    // Drop it, so that the pool has to open a brand new connection.
    first.destroy();

    const second = await getConnection();

    strict.strictEqual(await currentUser(second), poolUser);

    second.release();
  });

  await admin.query("DROP USER IF EXISTS 'pooluser1'@'%'");
  await admin.end();
});

