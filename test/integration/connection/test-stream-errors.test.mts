// This file was modified by Oracle on January 21, 2021.
// The connection with the mock server needs to happen in the same host where
// the tests are running in order to avoid connecting a potential MySQL server
// instance running in the host identified by the MYSQL_HOST environment
// variable.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

import type { Connection } from '../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection, createServer } from '../../common.test.mjs';

type TestError = Error & { code?: string; fatal?: boolean };

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

await describe('Stream Errors', async () => {
  await it('should handle stream errors correctly', async () => {
    let clientConnection: Connection | undefined;
    const err: Error & { code?: string } = new Error(
      'This socket has been ended by the other party'
    );
    err.code = 'EPIPE';

    let receivedError1: TestError | undefined;
    let receivedError2: TestError | undefined;
    let receivedError3: TestError | undefined;

    const query = 'SELECT 1';

    await new Promise<void>((resolve) => {
      const server = createServer(
        () => {
          clientConnection = createConnection({
            // The mock server is running on the same host machine.
            // We need to explicitly define the host to avoid connecting to a potential
            // different host provided via MYSQL_HOST that identifies a real MySQL
            // server instance.
            host: 'localhost',
            // @ts-expect-error: internal access
            port: server._port,
            // @ts-expect-error: TODO: implement typings
            ssl: false,
          });
          clientConnection?.query(query, (_err) => {
            if (_err && _err.code === 'HANDSHAKE_NO_SSL_SUPPORT') {
              clientConnection?.end();
            }
            receivedError1 = _err ?? undefined;
          });
          clientConnection?.query(
            'second query, should not be executed',
            () => {
              receivedError2 = err;
              clientConnection?.query(
                'trying to enqueue command to a connection which is already in error state',
                (_err1) => {
                  receivedError3 = _err1 ?? undefined;
                  resolve();
                }
              );
            }
          );
        },
        (conn) => {
          conn.on('query', () => {
            // @ts-expect-error: TODO: implement typings
            conn.writeColumns([
              {
                catalog: 'def',
                schema: '',
                table: '',
                orgTable: '',
                name: '1',
                orgName: '',
                characterSet: 63,
                columnLength: 1,
                columnType: 8,
                flags: 129,
                decimals: 0,
              },
            ]);
            // emulate  stream error here
            // @ts-expect-error: TODO: implement typings
            clientConnection?.stream.emit('error', err);
            // @ts-expect-error: TODO: implement typings
            clientConnection?.stream.end();
            // @ts-expect-error: TODO: implement typings
            server.close();
          });
        }
      );
    });

    assert.equal(receivedError1?.fatal, true);
    assert.equal(receivedError1?.code, err.code);
    assert.equal(receivedError2?.fatal, true);
    assert.equal(receivedError2?.code, err.code);
    assert.equal(receivedError3?.fatal, true);
    assert.equal(
      receivedError3?.message,
      "Can't add new command when connection is in closed state"
    );
  });
});
