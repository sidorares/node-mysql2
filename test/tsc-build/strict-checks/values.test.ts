/**
 * This test strictly validates the accepted shapes of the `values` parameter.
 * See https://github.com/sidorares/node-mysql2/issues/4275.
 */

import { mysql, mysqlp } from '../index.test.js';
import { access, sqlPS } from '../promise/baseConnection.test.js';

// Callbacks
{
  const conn = mysql.createConnection(access);
  const params: Record<string, unknown> = { id: 1, name: 'alice' };
  const jsonValue: Record<string, unknown> = { hello: 'world' };

  conn.execute(sqlPS, params, () => {});
  conn.query(sqlPS, params, () => {});

  conn.execute(sqlPS, [1], () => {});
  conn.query(sqlPS, [1, 'x', null], () => {});

  conn.execute('INSERT INTO data VALUES (?)', [jsonValue], () => {});
  conn.query('INSERT INTO data VALUES (?)', [jsonValue], () => {});

  // @ts-expect-error: undefined is not a valid execute bind parameter
  conn.execute(sqlPS, [undefined], () => {});
}

// Promise
(async () => {
  const conn = await mysqlp.createConnection(access);
  const params: Record<string, unknown> = { id: 1, name: 'alice' };

  await conn.execute(sqlPS, params);
  await conn.query(sqlPS, params);
})();
