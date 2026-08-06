import type { Socket } from 'node:net';
import { createServer as createTcpServer } from 'node:net';
import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import ClientFlags from '../../../lib/constants/client.js';
import Handshake from '../../../lib/packets/handshake.js';

function buildGreeting(): Buffer {
  let capabilityFlags = 0xffffff;
  capabilityFlags = capabilityFlags ^ (ClientFlags.COMPRESS | ClientFlags.SSL);

  const handshake = new Handshake({
    protocolVersion: 10,
    serverVersion: '8.0.0-stalled-test',
    connectionId: 1,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags,
    authPluginData1: Buffer.from('12345678'),
    authPluginData2: Buffer.from('901234567890'),
  });

  const packet = handshake.toPacket(0);
  packet.writeHeader(0);

  return packet.buffer;
}

await describe('connectTimeout covers the full handshake', async () => {
  const sockets = new Set<Socket>();
  let onClientData: () => void;
  const clientSentHandshakeResponse = new Promise<void>((resolve) => {
    onClientData = resolve;
  });

  // sends a valid greeting, then never answers the client HandshakeResponse
  const server = createTcpServer((socket) => {
    sockets.add(socket);
    socket.on('error', () => {});
    socket.on('data', () => onClientData());
    socket.write(buildGreeting());
  });

  const port = await new Promise<number>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        return reject(new Error('unexpected server address'));
      }
      resolve(address.port);
    });
  });

  await it('keeps the timer armed mid-handshake and fails with ETIMEDOUT', async () => {
    const connection = mysql.createConnection({
      host: '127.0.0.1',
      port,
      user: 'test_user',
      // generous value: the timer is fired manually below, this only needs to
      // outlive the test so it cannot race the assertions under load
      connectTimeout: 60000,
    });

    let watchdog: NodeJS.Timeout | undefined;

    try {
      const settled = new Promise<NodeJS.ErrnoException>((resolve, reject) => {
        watchdog = setTimeout(() => {
          reject(new Error('connect() never settled'));
        }, 10000);

        connection.connect((connectError) => {
          if (!connectError) {
            return reject(
              new Error(
                'connection unexpectedly succeeded against a stalled server'
              )
            );
          }

          resolve(connectError);
        });
      });
      settled.catch(() => {
        // inspected below; prevents an unhandled rejection when an assertion
        // fails before `settled` is awaited
      });

      await clientSentHandshakeResponse;

      // the handshake is in progress and the server went silent: the timer
      // must still be armed (it used to be cleared by the greeting bytes,
      // leaving the connection hanging forever)
      // @ts-expect-error: internal access
      strict.notEqual(connection.connectTimeout, null);

      // fire the timeout path without waiting out the timer
      // @ts-expect-error: internal access
      connection._handleTimeoutError();

      const err = await settled;
      strict.equal(err.code, 'ETIMEDOUT');
      strict.equal((err as Error & { fatal?: boolean }).fatal, true);
    } finally {
      clearTimeout(watchdog);
      connection.destroy();
    }
  });

  server.close();
  for (const socket of sockets) {
    socket.destroy();
  }
});

await describe('connectTimeout is cleared once the handshake completes', async () => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

  server.on('connection', (conn) => {
    conn.on('error', () => {
      // server side of the connection
      // ignore disconnects
    });
    conn.serverHandshake({
      serverVersion: 'node.js rocks',
    });
  });

  const port = await new Promise<number>((resolve, reject) => {
    // @ts-expect-error: TODO: implement typings
    server.listen(0, (err?: Error) => {
      if (err) return reject(err);
      // @ts-expect-error: internal access
      resolve(server._server.address().port as number);
    });
  });

  await it('clears the timer when the handshake completes', async () => {
    const connection = mysql.createConnection({
      host: '127.0.0.1',
      port,
      user: 'test_user',
      connectTimeout: 60000,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        connection.connect((err) => (err ? reject(err) : resolve()));
      });

      // @ts-expect-error: internal access
      strict.equal(connection.connectTimeout, null);
    } finally {
      connection.destroy();
    }
  });

  // @ts-expect-error: TODO: implement typings
  server.close();
});
