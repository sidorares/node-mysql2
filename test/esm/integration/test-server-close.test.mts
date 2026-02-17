// Copyright (c) 2021, Oracle and/or its affiliates.

import type { QueryError } from '../../../index.js';
import assert from 'node:assert';
import process from 'node:process';
import errors from '../../../lib/constants/errors.js';
import { createConnection } from '../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

// Uncaught AssertionError: Connection lost: The server closed the connection. == The client was disconnected by the server because of inactivity. See wait_timeout and interactive_timeout for configuring this behavior.
if (typeof Deno !== 'undefined') process.exit(0);

const connection = createConnection();

const customWaitTimeout = 1; // seconds

let error: QueryError;

connection.on('error', (err) => {
  error = err as QueryError;

  // @ts-expect-error: TODO: implement typings
  connection.close();
});

connection.query(`set wait_timeout=${customWaitTimeout}`, () => {
  setTimeout(() => {}, customWaitTimeout * 1000 * 2);
});

process.on('uncaughtException', (err) => {
  // The ERR Packet is only sent by MySQL server 8.0.24 or higher, so we
  // need to account for the fact it is not sent by older server versions.
  if ((err as NodeJS.ErrnoException).code !== 'ERR_ASSERTION') {
    throw err;
  }

  assert.equal(
    error.message,
    'Connection lost: The server closed the connection.'
  );
  assert.equal(error.code, 'PROTOCOL_CONNECTION_LOST');
});

process.on('exit', () => {
  assert.equal(
    error.message,
    'The client was disconnected by the server because of inactivity. See wait_timeout and interactive_timeout for configuring this behavior.'
  );
  assert.equal(error.code, errors.ER_CLIENT_INTERACTION_TIMEOUT);
});
