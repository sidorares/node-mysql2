import type { RowDataPacket } from '../../../../index.js';
import assert from 'node:assert';
import process from 'node:process';
import { createConnection } from '../../common.test.mjs';

const error = new Error('read ECONNRESET') as Error & {
  code?: string;
  errno?: number;
  syscall?: string;
};
error.code = 'ECONNRESET';
error.errno = -54;
error.syscall = 'read';

const connection = createConnection();

// Test that we ignore a ECONNRESET error if the connection
// is already closing, we close and then emit the error
connection.query<RowDataPacket[]>(`select 1 as "1"`, (_err, rows) => {
  assert.equal(rows[0]['1'], 1);
  // @ts-expect-error: TODO: implement typings
  connection.close();
  // @ts-expect-error: TODO: implement typings
  connection.stream.emit('error', error);
});

process.on('uncaughtException', (err: Error & { code?: string }) => {
  assert.notEqual(err.code, 'ECONNRESET');
});
