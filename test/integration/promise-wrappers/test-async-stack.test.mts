import type { ConnectionOptions } from '../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createConnection as promiseCreateConnection } from '../../../promise.js';
import { config } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: connect ECONNREFUSED');

await describe('Async stack traces', async () => {
  const createConnection = async function (args?: ConnectionOptions) {
    if (!args && process.env.MYSQL_CONNECTION_URL) {
      return promiseCreateConnection({ uri: process.env.MYSQL_CONNECTION_URL });
    }
    return promiseCreateConnection({ ...config, ...args });
  };

  await it('should propagate connection error with code and message', async () => {
    try {
      await createConnection({ host: '127.0.0.1', port: 33066 });
      strict(false, 'Expected connection to fail');
    } catch (err) {
      strict(err instanceof Error);
      strict((err as Error & { code?: string }).code === 'ECONNREFUSED');
      strict(typeof (err as Error).stack === 'string');
    }
  });

  await it('should propagate query error with code and message', async () => {
    const conn = await createConnection();
    try {
      await conn.query('syntax error');
      strict(false, 'Expected query to fail');
    } catch (err) {
      strict(err instanceof Error);
      strict((err as Error & { code?: string }).code === 'ER_PARSE_ERROR');
      strict(typeof (err as Error).message === 'string');
      strict(typeof (err as Error).stack === 'string');
    } finally {
      await conn.end();
    }
  });
});
