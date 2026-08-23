import type { RowDataPacket } from '../../index.js';
import type { Pool as PromisePool } from '../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection, createPool } from '../common.test.mjs';

type ResultRow = RowDataPacket & { result: number };

const captureError = (operation: Promise<unknown>): Promise<unknown> =>
  operation.then(
    () => null,
    (error: unknown) => error
  );

const sqlMessageFrom = (error: unknown): string =>
  error && typeof error === 'object' && 'sqlMessage' in error
    ? String((error as { sqlMessage?: unknown }).sqlMessage)
    : '';

await describe('Test namedPlaceholder as command parameter in connection', async () => {
  const query =
    'SELECT result FROM (SELECT 1 as result) temp WHERE temp.result=:named';
  const values = { named: 1 };

  await describe('connection query disables named placeholders', async () => {
    const connection = createConnection({ namedPlaceholders: true }).promise();
    const error = await captureError(
      connection.query({ sql: query, namedPlaceholders: false }, values)
    );
    await connection.end();

    it(() => {
      strict(
        sqlMessageFrom(error).match(/right syntax to use near ':named'/),
        'Enabled in connection config, disabled in query command'
      );
    });
  });

  await describe('connection query enables named placeholders', async () => {
    const connection = createConnection({ namedPlaceholders: false }).promise();
    const [rows] = await connection.query<ResultRow[]>(
      { sql: query, namedPlaceholders: true },
      values
    );
    await connection.end();

    it(() => {
      strict.equal(
        rows[0].result,
        1,
        'Disabled in connection config, enabled in query command'
      );
    });
  });

  await describe('connection execute disables named placeholders', async () => {
    const connection = createConnection({ namedPlaceholders: true }).promise();
    const error = await captureError(
      connection.execute({ sql: query, namedPlaceholders: false }, values)
    );
    await connection.end();

    it(() => {
      strict.equal(
        error instanceof TypeError,
        true,
        'Enabled in connection config, disabled in execute command'
      );
      strict.match(
        (error as TypeError).message,
        /Bind parameters must be array if namedPlaceholders parameter is not enabled/
      );
    });
  });

  await describe('connection execute enables named placeholders', async () => {
    const connection = createConnection({ namedPlaceholders: false }).promise();
    const [rows] = await connection.execute<ResultRow[]>(
      { sql: query, namedPlaceholders: true },
      values
    );
    await connection.end();

    it(() => {
      strict.equal(
        rows[0].result,
        1,
        'Disabled in connection config, enabled in execute command'
      );
    });
  });

  await describe('pool query disables named placeholders', async () => {
    const pool = createPool({ namedPlaceholders: true }).promise();
    const error = await captureError(
      pool.query({ sql: query, namedPlaceholders: false }, values)
    );
    await pool.end();

    it(() => {
      strict(
        sqlMessageFrom(error).match(/right syntax to use near ':named'/),
        'Enabled in pool config, disabled in query command'
      );
    });
  });

  await describe('pool query enables named placeholders', async () => {
    const pool: PromisePool = createPool({
      namedPlaceholders: false,
    }).promise();
    const [rows] = await pool.query<ResultRow[]>(
      { sql: query, namedPlaceholders: true },
      values
    );
    await pool.end();

    it(() => {
      strict.equal(
        rows[0].result,
        1,
        'Disabled in pool config, enabled in query command'
      );
    });
  });

  await describe('pool execute disables named placeholders', async () => {
    const pool = createPool({ namedPlaceholders: true }).promise();
    const error = await captureError(
      pool.execute({ sql: query, namedPlaceholders: false }, values)
    );
    await pool.end();

    it(() => {
      strict.equal(
        error instanceof TypeError,
        true,
        'Enabled in pool config, disabled in execute command'
      );
      strict.match(
        (error as TypeError).message,
        /Bind parameters must be array if namedPlaceholders parameter is not enabled/
      );
    });
  });

  await describe('pool execute enables named placeholders', async () => {
    const pool: PromisePool = createPool({
      namedPlaceholders: false,
    }).promise();
    const [rows] = await pool.execute<ResultRow[]>(
      { sql: query, namedPlaceholders: true },
      values
    );
    await pool.end();

    it(() => {
      strict.equal(
        rows[0].result,
        1,
        'Disabled in pool config, enabled in execute command'
      );
    });
  });
});
