// Copyright (c) 2021, Oracle and/or its affiliates.

import type { QueryError } from '../../index.js';
import process from 'node:process';
import { assert, describe, it, skip } from 'poku';
import errors from '../../lib/constants/errors.js';
import { createConnection } from '../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

if (typeof Deno !== 'undefined') skip('Deno: Connection lost assertion error');

await describe('Server Close', async () => {
  await it('should detect server-initiated connection close', async () => {
    const connection = createConnection();
    const customWaitTimeout = 1;

    await new Promise<void>((resolve) => {
      connection.on('error', (error: QueryError) => {
        // @ts-expect-error: TODO: implement typings
        connection.close();

        // The ERR Packet is only sent by MySQL server 8.0.24 or higher, so we
        // need to account for the fact it is not sent by older server versions.
        if (Number(error.code) === errors.ER_CLIENT_INTERACTION_TIMEOUT) {
          assert.equal(
            error.message,
            'The client was disconnected by the server because of inactivity. See wait_timeout and interactive_timeout for configuring this behavior.'
          );
        } else {
          assert.equal(
            error.message,
            'Connection lost: The server closed the connection.'
          );
          assert.equal(error.code, 'PROTOCOL_CONNECTION_LOST');
        }

        resolve();
      });

      connection.query(`set wait_timeout=${customWaitTimeout}`, () => {
        setTimeout(() => {}, customWaitTimeout * 1000 * 2);
      });
    });
  });
});
