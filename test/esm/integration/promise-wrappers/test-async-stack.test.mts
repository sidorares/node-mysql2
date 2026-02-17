import type { ConnectionOptions } from '../../../../index.js';
import process from 'node:process';
import ErrorStackParser from 'error-stack-parser';
import { assert } from 'poku';
import { createConnection as promiseCreateConnection } from '../../../../promise.js';
import { config } from '../../common.test.mjs';

// Uncaught Error: connect ECONNREFUSED 127.0.0.1:33066 - Local (undefined:undefined)
if (typeof Deno !== 'undefined') process.exit(0);

const createConnection = async function (args?: ConnectionOptions) {
  if (!args && process.env.MYSQL_CONNECTION_URL) {
    return promiseCreateConnection({ uri: process.env.MYSQL_CONNECTION_URL });
  }
  return promiseCreateConnection({ ...config, ...args });
};

async function test() {
  // TODO check this is actially required. This meant as a help for pre async/await node
  // to load entire file and do isAsyncSupported check instead of failing with syntax error

  let e1: Error, e2: Error;

  // TODO: investigate why connection is still open after ENETUNREACH
  async function test1() {
    e1 = new Error();
    // expected not to connect
    await createConnection({ host: '127.0.0.1', port: 33066 });
  }

  async function test2() {
    const conn = await createConnection();
    try {
      e2 = new Error();
      await Promise.all([conn.query('select 1+1'), conn.query('syntax error')]);
    } catch (err) {
      const stack = ErrorStackParser.parse(err as Error);
      const stackExpected = ErrorStackParser.parse(e2);
      assert(
        stack[1].getLineNumber() === (stackExpected[0].getLineNumber() ?? 0) + 1
      );
      conn.end();
    }
  }

  test1().catch((err) => {
    const stack = ErrorStackParser.parse(err);
    const stackExpected = ErrorStackParser.parse(e1);
    assert(
      stack[2].getLineNumber() === (stackExpected[0].getLineNumber() ?? 0) + 2
    );
    test2();
  });
}

test();
