// This file was modified by Oracle on June 1, 2021.
// The test has been updated to be able to pass with different default
// strict modes used by different MySQL server versions.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type SqlModeRow = RowDataPacket & { value: string };
type TimestampRow = RowDataPacket & { t: Date };

await describe('Invalid Date Result', async () => {
  const connection = createConnection();

  function isInvalidTime(t: Date | undefined) {
    return t ? isNaN(t.getTime()) : true;
  }

  // Disable NO_ZERO_DATE mode and NO_ZERO_IN_DATE mode to ensure the old
  // behaviour.
  const strictModes = ['NO_ZERO_DATE', 'NO_ZERO_IN_DATE'];

  await it('should handle invalid date values', async () => {
    const modeRows = await new Promise<SqlModeRow[]>((resolve, reject) => {
      connection.query<SqlModeRow[]>(
        'SELECT variable_value as value FROM performance_schema.session_variables where variable_name = ?',
        ['sql_mode'],
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    const deprecatedSqlMode = modeRows[0].value
      .split(',')
      .filter((mode) => strictModes.indexOf(mode) === -1)
      .join(',');

    await new Promise<void>((resolve, reject) => {
      connection.query(`SET sql_mode=?`, [deprecatedSqlMode], (err) =>
        err ? reject(err) : resolve()
      );
    });

    const rows = await new Promise<TimestampRow[]>((resolve, reject) => {
      connection.execute<TimestampRow[]>(
        'SELECT TIMESTAMP(0000-00-00) t',
        [],
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    strict.deepEqual(
      Object.prototype.toString.call(rows?.[0].t),
      '[object Date]'
    );
    strict.deepEqual(isInvalidTime(rows?.[0].t), true);
  });

  connection.end();
});
