'use strict';

const config = require('../../common.js').config;
const assert = require('assert');
const ErrorStackParser = require('error-stack-parser');

const createConnection = async function(args) {
  const connect = require('../../../promise.js').createConnection;
  if (!args && process.env.MYSQL_CONNECTION_URL) {
    return connect({ uri: process.env.MYSQL_CONNECTION_URL });
  }
  return connect({ ...config, ...args });
};

async function test() {
  // TODO check this is actially required. This meant as a help for pre async/await node
  // to load entire file and do isAsyncSupported check instead of failing with syntax error

  let e1, e2;

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
      const stack = ErrorStackParser.parse(err);
      const stackExpected = ErrorStackParser.parse(e2);
      assert(stack[1].getLineNumber() === stackExpected[0].getLineNumber() + 1);
      conn.end();
    }
  }

  test1().catch(err => {
    const stack = ErrorStackParser.parse(err);
    const stackExpected = ErrorStackParser.parse(e1);
    assert(stack[2].getLineNumber() === stackExpected[0].getLineNumber() + 2);
    test2();
  });
}

test();