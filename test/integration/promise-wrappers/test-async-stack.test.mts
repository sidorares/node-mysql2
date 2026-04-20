import type { ConnectionOptions } from '../../../index.js';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ErrorStackParser from 'error-stack-parser';
import { describe, it, skip, strict } from 'poku';
import { createConnection as promiseCreateConnection } from '../../../promise.js';
import { config } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: connect ECONNREFUSED');

const testFilePath = fileURLToPath(import.meta.url);
const testFileMarker = 'test-async-stack.test.mts';

/** Top stack frame is not always user code (e.g. Node may list processTicksAndRejections first). */
function assertStackIncludesThisTestFile(err: Error) {
  const frames = ErrorStackParser.parse(err);
  const inThisFile = frames.some((f) => {
    const file = f.fileName?.replace(/\\/g, '/') ?? '';
    return (
      file === testFilePath.replace(/\\/g, '/') ||
      file.endsWith(`/promise-wrappers/${testFileMarker}`)
    );
  });
  strict(
    inThisFile,
    `Expected error stack to reference ${testFileMarker}; got:\n${err.stack}`
  );
}

await describe('Async stack traces', async () => {
  const createConnection = async function (args?: ConnectionOptions) {
    if (!args && process.env.MYSQL_CONNECTION_URL) {
      return promiseCreateConnection({ uri: process.env.MYSQL_CONNECTION_URL });
    }
    return promiseCreateConnection({ ...config, ...args });
  };

  // TODO: investigate why connection is still open after ENETUNREACH
  await it('should include caller stack in connection error', async () => {
    try {
      await createConnection({ host: '127.0.0.1', port: 33066 });
    } catch (err) {
      assertStackIncludesThisTestFile(err as Error);
    }
  });

  await it('should include caller stack in query error', async () => {
    const conn = await createConnection();
    try {
      await Promise.all([conn.query('select 1+1'), conn.query('syntax error')]);
    } catch (err) {
      assertStackIncludesThisTestFile(err as Error);
    } finally {
      await conn.end();
    }
  });
});
