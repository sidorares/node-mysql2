import type { TlsOptions, TLSSocket } from 'node:tls';
import type { SslOptions } from '../../../index.js';
import { constants } from 'node:crypto';
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
  skip('Deno: node:tls ignores ecdhCurve and its servers fail to listen');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certs = path.join(__dirname, '../../fixtures/ssl/chain');
const ca = fs.readFileSync(path.join(certs, 'ca.pem'), 'utf8');
const key = fs.readFileSync(path.join(certs, 'server-key.pem'));
const cert = fs.readFileSync(path.join(certs, 'server-cert.pem'));

const sockets: TLSSocket[] = [];

const listen = async (options: TlsOptions) => {
  const server = tls.createServer({ key, cert, ...options });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port =
    typeof address === 'object' && address !== null ? address.port : 0;

  return { server, port };
};

const upgrade = async (
  port: number,
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
const PROTOCOL_VERSION = /PROTOCOL_VERSION/;

await describe('TLS ecdhCurve', async () => {
  const { server, port } = await listen({ ecdhCurve: 'P-384' });

  await it('should offer only the groups set in ecdhCurve', async () => {
    const error = await upgrade(port, { ca, ecdhCurve: 'P-256' });

    strict.match(String(error?.code), HANDSHAKE_FAILURE);
  });

  await it('should connect when ecdhCurve has a group the server accepts', async () => {
    const error = await upgrade(port, { ca, ecdhCurve: 'P-256:P-384' });

    strict.equal(error, undefined);
  });

  await it('should apply a new ecdhCurve set on a shared ssl object', async () => {
    const ssl: SslOptions = { ca, ecdhCurve: 'P-384' };
    const accepted = await upgrade(port, ssl);
    ssl.ecdhCurve = 'P-256';
    const rejected = await upgrade(port, ssl);
    ssl.ecdhCurve = 'P-384';
    const acceptedAgain = await upgrade(port, ssl);

    strict.equal(accepted, undefined);
    strict.match(String(rejected?.code), HANDSHAKE_FAILURE);
    strict.equal(acceptedAgain, undefined);
  });

  server.close();
});

await describe('TLS secureOptions', async () => {
  const { server, port } = await listen({ minVersion: 'TLSv1.3' });

  await it('should apply the OpenSSL options set in secureOptions', async () => {
    const error = await upgrade(port, {
      ca,
      secureOptions: constants.SSL_OP_NO_TLSv1_3,
    });

    strict.match(String(error?.code), PROTOCOL_VERSION);
  });

  await it('should apply a new secureOptions set on a shared ssl object', async () => {
    const ssl: SslOptions = { ca };
    const accepted = await upgrade(port, ssl);
    ssl.secureOptions = constants.SSL_OP_NO_TLSv1_3;
    const rejected = await upgrade(port, ssl);
    ssl.secureOptions = undefined;
    const acceptedAgain = await upgrade(port, ssl);

    strict.equal(accepted, undefined);
    strict.match(String(rejected?.code), PROTOCOL_VERSION);
    strict.equal(acceptedAgain, undefined);
  });

  server.close();
});

for (const socket of sockets) {
  socket.destroy();
}
