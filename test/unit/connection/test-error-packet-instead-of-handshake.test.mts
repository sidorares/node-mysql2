import { Buffer } from 'node:buffer';
import { createServer } from 'node:net';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

const ER_CON_COUNT_ERROR = 1040;

const errorGreeting = (): Buffer => {
  const message = Buffer.from('Too many connections', 'latin1');
  const payload = Buffer.concat([
    Buffer.from([0xff, ER_CON_COUNT_ERROR & 0xff, ER_CON_COUNT_ERROR >> 8]),
    message,
  ]);
  const header = Buffer.from([payload.length & 0xff, 0, 0, 0]);
  return Buffer.concat([header, payload]);
};

await describe('Server error packet instead of the handshake hello', async () => {
  const server = createServer((socket) => {
    socket.on('error', () => {});
    socket.end(errorGreeting());
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('server has no bound address');
  }

  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: address.port,
  });

  const failure = await new Promise<{
    code?: string;
    errno?: number;
    message?: string;
  }>((resolve, reject) => {
    connection.once('connect', () =>
      reject(new Error('connect must never fire'))
    );
    connection.on('error', (err) => resolve(err));
  });

  it('surfaces the server error instead of crashing on a null handshake', () => {
    strict.equal(failure.errno, ER_CON_COUNT_ERROR);
    strict.equal(failure.code, 'ER_CON_COUNT_ERROR');
    strict.equal(failure.message, 'Too many connections');
    strict.ok(!connection.threadId);
  });

  connection.destroy();
  server.close();
});
