import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import ClientConstants from '../../../lib/constants/client.js';
import HandshakeResponse from '../../../lib/packets/handshake_response.js';
import Packet from '../../../lib/packets/packet.js';

const allFlags =
  ClientConstants.LONG_PASSWORD |
  ClientConstants.CONNECT_WITH_DB |
  ClientConstants.PLUGIN_AUTH |
  ClientConstants.SECURE_CONNECTION |
  ClientConstants.CONNECT_ATTRS;

const baseConfig = {
  user: 'testuser',
  database: 'testdb',
  flags: allFlags,
  charsetNumber: 255,
  authToken: Buffer.alloc(20),
  authPluginName: 'mysql_native_password',
  connectAttributes: { _client_name: 'test', _pid: '1234' },
};

function buildPacket(
  config: Omit<typeof baseConfig, 'connectAttributes'> & {
    connectAttributes?: Record<string, string>;
  }
): Packet {
  const response = new HandshakeResponse(config);
  return response.toPacket();
}

function parsePacket(
  packet: typeof Packet.prototype,
  serverFlags?: number
): ReturnType<typeof HandshakeResponse.fromPacket> {
  const buf = packet.buffer;
  const readPacket = new Packet(0, buf, 0, buf.length);
  return serverFlags !== undefined
    ? HandshakeResponse.fromPacket(readPacket, serverFlags)
    : HandshakeResponse.fromPacket(readPacket);
}

await describe('HandshakeResponse.fromPacket server flags masking', async () => {
  await it('should parse all fields when server supports all client flags', () => {
    const parsed = parsePacket(buildPacket(baseConfig), allFlags);

    strict.equal(parsed.user, 'testuser');
    strict.equal(parsed.database, 'testdb');
    strict.equal(parsed.authPluginName, 'mysql_native_password');
    strict.deepEqual(parsed.connectAttributes, {
      _client_name: 'test',
      _pid: '1234',
    });
  });

  await it('should skip connectAttributes when server does not support CONNECT_ATTRS', () => {
    const serverFlags = allFlags & ~ClientConstants.CONNECT_ATTRS;
    const parsed = parsePacket(buildPacket(baseConfig), serverFlags);

    strict.equal(parsed.user, 'testuser');
    strict.equal(parsed.database, 'testdb');
    strict.equal(parsed.authPluginName, 'mysql_native_password');
    strict.equal(parsed.connectAttributes, undefined);
  });

  await it('should parse correctly when client also omits CONNECT_ATTRS', () => {
    const flagsWithoutAttrs = allFlags & ~ClientConstants.CONNECT_ATTRS;
    const config = {
      ...baseConfig,
      flags: flagsWithoutAttrs,
      connectAttributes: undefined,
    };
    const parsed = parsePacket(buildPacket(config), flagsWithoutAttrs);

    strict.equal(parsed.user, 'testuser');
    strict.equal(parsed.database, 'testdb');
    strict.equal(parsed.authPluginName, 'mysql_native_password');
    strict.equal(parsed.connectAttributes, undefined);
  });

  await it('should preserve raw clientFlags in the returned args', () => {
    const serverFlags = allFlags & ~ClientConstants.CONNECT_ATTRS;
    const parsed = parsePacket(buildPacket(baseConfig), serverFlags);

    strict.ok(
      parsed.clientFlags & ClientConstants.CONNECT_ATTRS,
      'raw clientFlags should still contain the CONNECT_ATTRS bit the client sent'
    );
  });

  await it('should parse all fields when serverFlags is omitted (backward compat)', () => {
    const parsed = parsePacket(buildPacket(baseConfig));

    strict.equal(parsed.user, 'testuser');
    strict.equal(parsed.database, 'testdb');
    strict.equal(parsed.authPluginName, 'mysql_native_password');
    strict.deepEqual(parsed.connectAttributes, {
      _client_name: 'test',
      _pid: '1234',
    });
  });
});
