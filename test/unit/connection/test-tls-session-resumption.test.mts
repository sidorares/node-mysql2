import type { TLSSocket } from 'node:tls';
import { once } from 'node:events';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';
import { describe, it, strict } from 'poku';
import BaseConnection from '../../../lib/base/connection.js';
import ConnectionConfig from '../../../lib/connection_config.js';
import TlsSessionSlot from '../../../lib/tls_session_cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certs = path.join(__dirname, '../../fixtures/ssl/chain');
const ca = fs.readFileSync(path.join(certs, 'ca.pem'), 'utf8');

type Ssl = {
  ca: string;
  minVersion?: string;
  rejectUnauthorized?: boolean;
  verifyIdentity?: boolean;
};

const server = tls.createServer({
  key: fs.readFileSync(path.join(certs, 'server-key.pem')),
  cert: fs.readFileSync(path.join(certs, 'server-cert.pem')),
});

let dropNextHandshake = false;
server.on('connection', (socket: net.Socket) => {
  if (dropNextHandshake) {
    dropNextHandshake = false;
    socket.destroy();
  }
});

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const port = typeof address === 'object' && address !== null ? address.port : 0;

const sockets: TLSSocket[] = [];

type Upgrade = { error: NodeJS.ErrnoException | undefined; socket: TLSSocket };

const upgrade = async (
  ssl: Ssl,
  host = 'resumption.test'
): Promise<Upgrade> => {
  const stream = net.connect(port, '127.0.0.1');
  await once(stream, 'connect');

  const config = new ConnectionConfig({
    host,
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
  const socket: TLSSocket = connection.stream;
  sockets.push(socket);
  const issued = once(socket, 'session').catch(() => {});
  const error = await secure;

  if (error === undefined && !socket.isSessionReused()) {
    await issued;
  }

  return { error, socket };
};

await describe('TLS session resumption', async () => {
  const ssl: Ssl = { ca, rejectUnauthorized: true, verifyIdentity: true };

  await it('should resume the session issued by a previous handshake', async () => {
    const first = await upgrade(ssl);
    const second = await upgrade(ssl);

    strict.equal(first.error, undefined);
    strict.equal(first.socket.isSessionReused(), false);
    strict.equal(second.error, undefined);
    strict.equal(second.socket.isSessionReused(), true);
  });

  await it('should keep failing identity checks instead of resuming past them', async () => {
    const first = await upgrade(ssl, 'localhost');
    const second = await upgrade(ssl, 'localhost');

    strict.equal(first.error?.code, 'ERR_TLS_CERT_ALTNAME_INVALID');
    strict.equal(second.error?.code, 'ERR_TLS_CERT_ALTNAME_INVALID');
    strict.equal(
      new TlsSessionSlot(ssl, 'localhost', port, true, true).get(),
      undefined
    );
  });

  await it('should not resume with a session established under a laxer config', async () => {
    ssl.rejectUnauthorized = false;
    ssl.verifyIdentity = false;
    const lax = await upgrade(ssl);
    ssl.rejectUnauthorized = true;
    const strictAgain = await upgrade(ssl);
    ssl.verifyIdentity = true;
    const strictest = await upgrade(ssl);

    strict.equal(lax.error, undefined);
    strict.equal(lax.socket.isSessionReused(), false);
    strict.equal(strictAgain.error, undefined);
    strict.equal(strictAgain.socket.isSessionReused(), false);
    strict.equal(strictest.error, undefined);
    strict.equal(strictest.socket.isSessionReused(), true);
  });

  await it('should drop the cached session when a handshake fails', async () => {
    dropNextHandshake = true;
    const failed = await upgrade(ssl);
    const full = await upgrade(ssl);
    const resumed = await upgrade(ssl);

    strict.ok(failed.error instanceof Error);
    strict.equal(full.error, undefined);
    strict.equal(full.socket.isSessionReused(), false);
    strict.equal(resumed.socket.isSessionReused(), true);
  });

  await it('should not resume after the certificate material changes', async () => {
    ssl.minVersion = 'TLSv1.2';
    const full = await upgrade(ssl);
    const resumed = await upgrade(ssl);

    strict.equal(full.error, undefined);
    strict.equal(full.socket.isSessionReused(), false);
    strict.equal(resumed.socket.isSessionReused(), true);
  });

  for (const socket of sockets) {
    socket.destroy();
  }
  server.close();
});
