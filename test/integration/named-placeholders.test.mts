import type { RowDataPacket } from '../../index.js';
import type { Pool as PromisePool } from '../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection, createPool } from '../common.test.mjs';

type ResultRow = RowDataPacket & { result: number };

await describe('Test namedPlaceholder as command parameter in connection', async () => {
  const query =
    'SELECT result FROM (SELECT 1 as result) temp WHERE temp.result=:named';
  const values = { named: 1 };

  await it(async () => {
    const c = createConnection({ namedPlaceholders: true }).promise();

    try {
      await c.query({ sql: query, namedPlaceholders: false }, values);
      strict.fail('Enabled in connection config, disabled in query command');
    } catch (err: unknown) {
      const sqlMessage =
        err && typeof err === 'object' && 'sqlMessage' in err
          ? String((err as { sqlMessage?: unknown }).sqlMessage)
          : '';
      strict(
        sqlMessage.match(/right syntax to use near ':named'/),
        'Enabled in connection config, disabled in query command'
      );
    } finally {
      await c.end();
    }
  });

  await it(async () => {
    const c = createConnection({ namedPlaceholders: false }).promise();

    const [rows] = await c.query<ResultRow[]>(
      { sql: query, namedPlaceholders: true },
      values
    );
    await c.end();

    strict.equal(
      rows[0].result,
      1,
      'Disabled in connection config, enabled in query command'
    );
  });

  await it(async () => {
    const c = createConnection({ namedPlaceholders: true }).promise();

    try {
      await c.execute({ sql: query, namedPlaceholders: false }, values);
      strict.fail('Enabled in connection config, disabled in execute command');
    } catch (err: unknown) {
      // With namedPlaceholders disabled, object bind params are rejected.
      strict.equal(
        err instanceof TypeError,
        true,
        'Enabled in connection config, disabled in execute command'
      );
      strict.match(
        (err as TypeError).message,
        /Bind parameters must be array if namedPlaceholders parameter is not enabled/
      );
    } finally {
      await c.end();
    }
  });

  await it(async () => {
    const c = createConnection({ namedPlaceholders: false }).promise();

    const [rows] = await c.execute<ResultRow[]>(
      { sql: query, namedPlaceholders: true },
      values
    );
    await c.end();

    strict.equal(
      rows[0].result,
      1,
      'Disabled in connection config, enabled in execute command'
    );
  });

  await it(async () => {
    const c = createPool({ namedPlaceholders: true }).promise();

    try {
      await c.query({ sql: query, namedPlaceholders: false }, values);
      strict.fail('Enabled in pool config, disabled in query command');
    } catch (err: unknown) {
      const sqlMessage =
        err && typeof err === 'object' && 'sqlMessage' in err
          ? String((err as { sqlMessage?: unknown }).sqlMessage)
          : '';
      strict(
        sqlMessage.match(/right syntax to use near ':named'/),
        'Enabled in pool config, disabled in query command'
      );
    } finally {
      await c.end();
    }
  });

  await it(async () => {
    const c: PromisePool = createPool({ namedPlaceholders: false }).promise();

    const [rows] = await c.query<ResultRow[]>(
      { sql: query, namedPlaceholders: true },
      values
    );
    await c.end();

    strict.equal(
      rows[0].result,
      1,
      'Disabled in pool config, enabled in query command'
    );
  });

  await it(async () => {
    const c = createPool({ namedPlaceholders: true }).promise();

    try {
      await c.execute({ sql: query, namedPlaceholders: false }, values);
      strict.fail('Enabled in pool config, disabled in execute command');
    } catch (err: unknown) {
      strict.equal(
        err instanceof TypeError,
        true,
        'Enabled in pool config, disabled in execute command'
      );
      strict.match(
        (err as TypeError).message,
        /Bind parameters must be array if namedPlaceholders parameter is not enabled/
      );
    } finally {
      await c.end();
    }
  });

  await it(async () => {
    const c: PromisePool = createPool({ namedPlaceholders: false }).promise();

    const [rows] = await c.execute<ResultRow[]>(
      { sql: query, namedPlaceholders: true },
      values
    );
    await c.end();

    strict.equal(
      rows[0].result,
      1,
      'Disabled in pool config, enabled in execute command'
    );
  });
});
