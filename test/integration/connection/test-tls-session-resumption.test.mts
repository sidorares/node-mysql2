import type { RowDataPacket } from '../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import driver from '../../../index.js';
import { config, getConfig, getMysqlVersion } from '../../common.test.mjs';

if (process.env.MYSQL_USE_TLS !== '1' || config.ssl === undefined) {
  skip('TLS session resumption needs MYSQL_USE_TLS=1');
}

type StatusRow = RowDataPacket & { Variable_name: string; Value: string };

const ssl = config.ssl;

await describe('TLS session resumption across pooled connections', async () => {
  const pool = driver.createPool({ ...getConfig(), ssl }).promise();

  const first = await pool.getConnection();
  await first.query('SELECT 1');
  const second = await pool.getConnection();
  const { isMariaDB } = await getMysqlVersion(second);
  const [status] = await second.query<StatusRow[]>(
    "SHOW SESSION STATUS LIKE 'Ssl_sessions_reused'"
  );

  it('should resume the session of the first pooled connection', () => {
    // @ts-expect-error: internal access
    strict.equal(first.connection.stream.isSessionReused(), false);
    // @ts-expect-error: internal access
    strict.equal(second.connection.stream.isSessionReused(), true);
  });

  it('should be confirmed by the server', () => {
    if (isMariaDB) {
      return;
    }

    strict.equal(status[0].Value, '1');
  });

  first.release();
  second.release();
  await pool.end();
});
