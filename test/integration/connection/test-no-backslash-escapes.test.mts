import type { Raw, RowDataPacket } from '../../../index.js';
import type { QueryTraceContext } from '../../../typings/mysql/lib/Tracing.js';
import diagnostics_channel from 'node:diagnostics_channel';
import { describe, it, strict } from 'poku';
import { format } from '../../../index.js';
import { createConnection } from '../../common.test.mjs';

type ValueRow = RowDataPacket & { value: string };

const enableMode =
  "SET SESSION sql_mode = CONCAT(@@SESSION.sql_mode, ',NO_BACKSLASH_ESCAPES')";
const disableMode =
  "SET SESSION sql_mode = REPLACE(@@SESSION.sql_mode, 'NO_BACKSLASH_ESCAPES', '')";
const attack = "x\\' OR 1=1 -- ";
const values = ["it's", 'C:\\dir\\', attack, '\\\'"\n\0'];
const matchesOther = "SELECT 1 AS matched FROM DUAL WHERE ? = 'other'";

await describe('NO_BACKSLASH_ESCAPES', async () => {
  await describe('a session in the mode', async () => {
    const connection = createConnection().promise();

    await it('should escape strings for the mode', async () => {
      await connection.query(enableMode);
      const escaped = connection.escape("it's C:\\");
      const results = await Promise.all(
        values.map((value) =>
          connection.query<ValueRow[]>('SELECT ? AS value', [value])
        )
      );

      strict.equal(escaped, "'it''s C:\\'");
      strict.deepEqual(
        results.map(([rows]) => rows[0].value),
        values
      );
    });

    await it('should keep a value that ends in a backslash quote inside its string', async () => {
      await connection.query(enableMode);
      const [rows] = await connection.query<RowDataPacket[]>(matchesOther, [
        attack,
      ]);

      strict.equal(rows.length, 0);
    });

    await connection.end();
  });

  await describe('a session that leaves the mode', async () => {
    const connection = createConnection().promise();

    await it('should escape with backslashes again', async () => {
      await connection.query(enableMode);
      await connection.query(disableMode);
      const escaped = connection.escape("it's C:\\");
      const [rows] = await connection.query<ValueRow[]>('SELECT ? AS value', [
        values[3],
      ]);

      strict.equal(escaped, "'it\\'s C:\\\\'");
      strict.equal(rows[0].value, values[3]);
    });

    await connection.end();
  });

  await describe('a mode change queued before the query', async () => {
    const connection = createConnection().promise();

    await it('should escape for the mode when the query is sent', async () => {
      const setMode = connection.query(enableMode);
      const select = connection.query<ValueRow[]>('SELECT ? AS value', [
        values[1],
      ]);
      await setMode;
      const [rows] = await select;

      strict.equal(rows[0].value, values[1]);
    });

    await connection.end();
  });

  await describe('queued queries whose values change after the call', async () => {
    const connection = createConnection().promise();

    await it('should send each value as it was when query() was called', async () => {
      const params: number[] = [];
      const setMode = connection.query(enableMode);
      const selects = [1, 2, 3].map((id) => {
        params[0] = id;
        return connection.query<RowDataPacket[]>('SELECT ? AS value', params);
      });
      await setMode;
      const results = await Promise.all(selects);

      strict.deepEqual(
        results.map(([rows]) => rows[0].value),
        [1, 2, 3]
      );
    });

    await connection.end();
  });

  await describe('a nested connection.format() in a queued query', async () => {
    const callbackConnection = createConnection();
    const connection = callbackConnection.promise();

    await it('should escape for the mode the query is sent in', async () => {
      const nested: Raw = {
        toSqlString: () => callbackConnection.format('?', [attack]),
      };
      const setMode = connection.query(enableMode);
      const select = connection.query<RowDataPacket[]>(matchesOther, [nested]);
      await setMode;
      const [rows] = await select;

      strict.equal(rows.length, 0);
    });

    await connection.end();
  });

  await describe('a toSqlString() that passes the mode on', async () => {
    const connection = createConnection().promise();

    await it('should escape the nested value for the mode', async () => {
      const nested: Raw = {
        toSqlString: (sqlMode) =>
          format('?', [attack], false, 'local', sqlMode),
      };
      await connection.query(enableMode);
      const [rows] = await connection.query<RowDataPacket[]>(matchesOther, [
        nested,
      ]);

      strict.equal(rows.length, 0);
    });

    await connection.end();
  });

  await describe('the traced query text', async () => {
    const connection = createConnection().promise();
    const traced: string[] = [];
    const subscribers = {
      start(context: object) {
        traced.push((context as QueryTraceContext).query);
      },
      end() {},
      asyncStart() {},
      asyncEnd(context: object) {
        traced.push((context as QueryTraceContext).query);
      },
      error() {},
    };
    const hasTracingChannel =
      typeof diagnostics_channel.tracingChannel === 'function';

    if (hasTracingChannel) {
      diagnostics_channel.tracingChannel('mysql2:query').subscribe(subscribers);
    }

    await it('should be the SQL sent after a queued mode change', async () => {
      const setMode = connection.query(enableMode);
      const select = connection.query('SELECT ? AS value', ["it's"]);
      await setMode;
      await select;

      strict.equal(
        !hasTracingChannel || traced.includes("SELECT 'it''s' AS value"),
        true
      );
    });

    if (hasTracingChannel) {
      diagnostics_channel
        .tracingChannel('mysql2:query')
        .unsubscribe(subscribers);
    }
    await connection.end();
  });

  await describe('the status reported at the end of a result set', async () => {
    const connection = createConnection().promise();

    await it('should follow the mode the last row reports', async () => {
      await connection.query(enableMode);
      // @ts-expect-error: internal access
      connection.connection.serverStatus = 0;
      await connection.query('SELECT 1');
      const escaped = connection.escape("it's");

      strict.equal(escaped, "'it''s'");
    });

    await connection.end();
  });

  await describe('a reset', async () => {
    const connection = createConnection().promise();

    await it('should follow the mode the reset restores', async () => {
      await connection.query(enableMode);
      await connection.reset();
      const escaped = connection.escape("it's");

      strict.equal(escaped, "'it\\'s'");
    });

    await connection.end();
  });

  await describe('a custom queryFormat', async () => {
    let calls = 0;
    const connection = createConnection().promise();

    connection.config.queryFormat = (sql: string) => {
      calls++;
      return sql;
    };

    await it('should run once per query when the mode changes before the send', async () => {
      const setMode = connection.query(enableMode);
      const select = connection.query('SELECT 1');
      await setMode;
      await select;

      strict.equal(calls, 2);
    });

    await connection.end();
  });
});
