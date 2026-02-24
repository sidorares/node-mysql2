import type { ConnectionOptions } from '../../../index.js';
import process from 'node:process';
import ErrorStackParser from 'error-stack-parser';
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

  // TODO: investigate why connection is still open after ENETUNREACH
  await it('should include caller stack in connection error', async () => {
    let e1: Error;
    try {
      e1 = new Error();
      // expected not to connect
      await createConnection({ host: '127.0.0.1', port: 33066 });
    } catch (err) {
      const stack = ErrorStackParser.parse(err as Error);
      const stackExpected = ErrorStackParser.parse(e1!);
      strict(
        stack[2].getLineNumber() === (stackExpected[0].getLineNumber() ?? 0) + 2
      );
    }
  });

  await it('should include caller stack in query error', async () => {
    const conn = await createConnection();
    let e2: Error;
    try {
      e2 = new Error();
      await Promise.all([conn.query('select 1+1'), conn.query('syntax error')]);
    } catch (err) {
      const stack = ErrorStackParser.parse(err as Error);
      const stackExpected = ErrorStackParser.parse(e2!);
      strict(
        stack[1].getLineNumber() === (stackExpected[0].getLineNumber() ?? 0) + 1
      );
    } finally {
      await conn.end();
    }
  });
});
