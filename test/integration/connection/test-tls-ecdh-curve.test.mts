import type { TLSSocket } from 'node:tls';
import type { RowDataPacket } from '../../../promise.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { config, createConnection } from '../../common.test.mjs';

if (process.env.MYSQL_USE_TLS !== '1' || config.ssl === undefined) {
  skip('ecdhCurve needs MYSQL_USE_TLS=1');
}

if (typeof Deno !== 'undefined') {
  skip('Deno: node:tls ignores ecdhCurve');
}

if (process.versions.bun !== undefined) {
  skip('Bun: TLSSocket does not report the negotiated group');
}

await describe('TLS ecdhCurve against the server', async () => {
  const connection = createConnection({
    ssl: { ...config.ssl, ecdhCurve: 'P-256' },
  }).promise();

  const [rows] = await connection.query<RowDataPacket[]>('SELECT 1 AS one');
  // @ts-expect-error: internal access
  const socket: TLSSocket = connection.connection.stream;
  const keyExchange = socket.getEphemeralKeyInfo();
  const isFiniteFieldDhe =
    keyExchange !== null && 'type' in keyExchange && keyExchange.type === 'DH';

  it('should run queries with ecdhCurve set', () => {
    strict.deepEqual(rows, [{ one: 1 }]);
  });

  it('should use the group set in ecdhCurve for an elliptic curve key exchange', () => {
    if (isFiniteFieldDhe) {
      return;
    }

    strict.deepEqual(keyExchange, {
      type: 'ECDH',
      name: 'prime256v1',
      size: 256,
    });
  });

  await connection.end();
});
