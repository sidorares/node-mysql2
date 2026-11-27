import type { TLSSocket } from 'node:tls';
import type { SslOptions } from '../../../index.js';
import { once } from 'node:events';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';
import { describe, it, skip, strict } from 'poku';
import BaseConnection from '../../../lib/base/connection.js';
import ConnectionConfig from '../../../lib/connection_config.js';

if (typeof Deno !== 'undefined') {
  skip('Deno: node:tls ignores ecdhCurve');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certs = path.join(__dirname, '../../fixtures/ssl/chain');
const ca = fs.readFileSync(path.join(certs, 'ca.pem'), 'utf8');

const server = tls.createServer({
  key: fs.readFileSync(path.join(certs, 'server-key.pem')),
  cert: fs.readFileSync(path.join(certs, 'server-cert.pem')),
  ecdhCurve: 'P-384',
});

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const port = typeof address === 'object' && address !== null ? address.port : 0;

const sockets: TLSSocket[] = [];

const upgrade = async (
  ssl: SslOptions
): Promise<NodeJS.ErrnoException | undefined> => {
  const stream = net.connect(port, '127.0.0.1');
  await once(stream, 'connect');

  const config = new ConnectionConfig({
    host: 'resumption.test',
    port,
    ssl,
    stream,
    isServer: true,
    connectTimeout: 0,
  });
  const connection = new BaseConnection({ config });
  connection.on('error', () => {});

  const secure = new Promise<NodeJS.ErrnoException | undefined>((resolve) => {
    connection.startTLS(resolve);
  });
  sockets.push(connection.stream);

  return secure;
};

const HANDSHAKE_FAILURE = /HANDSHAKE_FAILURE/;

await describe('TLS ecdhCurve', async () => {
  await it('should offer only the groups set in ecdhCurve', async () => {
    const error = await upgrade({ ca, ecdhCurve: 'P-256' });

    strict.match(String(error?.code), HANDSHAKE_FAILURE);
  });

  await it('should connect when ecdhCurve has a group the server accepts', async () => {
    const error = await upgrade({ ca, ecdhCurve: 'P-256:P-384' });

    strict.equal(error, undefined);
  });

  await it('should apply a new ecdhCurve set on a shared ssl object', async () => {
    const ssl: SslOptions = { ca, ecdhCurve: 'P-384' };
    const accepted = await upgrade(ssl);
    ssl.ecdhCurve = 'P-256';
    const rejected = await upgrade(ssl);
    ssl.ecdhCurve = 'P-384';
    const acceptedAgain = await upgrade(ssl);

    strict.equal(accepted, undefined);
    strict.match(String(rejected?.code), HANDSHAKE_FAILURE);
    strict.equal(acceptedAgain, undefined);
  });

  for (const socket of sockets) {
    socket.destroy();
  }
  server.close();
});
