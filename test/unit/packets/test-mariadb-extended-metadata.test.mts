import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import ClientConstants from '../../../lib/constants/client.js';
import MariaDBClientConstants from '../../../lib/constants/mariadb_client.js';
import ColumnDefinition from '../../../lib/packets/column_definition.js';
import HandshakeResponse from '../../../lib/packets/handshake_response.js';
import Handshake from '../../../lib/packets/handshake.js';
import Packet from '../../../lib/packets/packet.js';
import SSLRequest from '../../../lib/packets/ssl_request.js';

const lenenc = (value: string | Buffer): Buffer => {
  const buf = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  strict.ok(buf.length < 251);
  return Buffer.concat([Buffer.from([buf.length]), buf]);
};

const asPacket = (payload: Buffer): typeof Packet.prototype => {
  const buf = Buffer.concat([Buffer.alloc(4), payload]);
  return new Packet(0, buf, 0, buf.length);
};

const buildHandshakePayload = (
  serverCapabilities: number,
  mariadbExtendedCapabilities: number
): Buffer => {
  const capabilities = Buffer.alloc(4);
  capabilities.writeUInt32LE(serverCapabilities >>> 0, 0);
  const extendedCapabilities = Buffer.alloc(4);
  extendedCapabilities.writeUInt32LE(mariadbExtendedCapabilities >>> 0, 0);
  return Buffer.concat([
    Buffer.from([10]), // protocol version
    Buffer.from('11.8.2-MariaDB\0', 'latin1'), // server version
    Buffer.from([1, 0, 0, 0]), // connection id
    Buffer.alloc(8, 0x2a), // auth plugin data part 1
    Buffer.from([0]), // filler
    capabilities.subarray(0, 2), // capabilities (lower 2 bytes)
    Buffer.from([45]), // server default collation
    Buffer.from([2, 0]), // status flags
    capabilities.subarray(2, 4), // capabilities (upper 2 bytes)
    Buffer.from([21]), // length of auth plugin data
    Buffer.alloc(6, 0), // filler
    extendedCapabilities, // MariaDB extended capabilities (or filler)
    Buffer.alloc(13, 0x2b), // auth plugin data part 2
    Buffer.from('mysql_native_password\0', 'latin1'),
  ]);
};

const mariadbServerCapabilities =
  ClientConstants.PROTOCOL_41 |
  ClientConstants.SECURE_CONNECTION |
  ClientConstants.PLUGIN_AUTH;

describe('Handshake packet: MariaDB extended capabilities', () => {
  it('should parse extended capabilities when CLIENT_MYSQL is unset', () => {
    const handshake = Handshake.fromPacket(
      asPacket(
        buildHandshakePayload(
          mariadbServerCapabilities,
          MariaDBClientConstants.MARIADB_CLIENT_EXTENDED_METADATA |
            MariaDBClientConstants.MARIADB_CLIENT_PROGRESS
        )
      )
    );
    strict.equal(
      handshake.mariadbExtendedCapabilityFlags,
      MariaDBClientConstants.MARIADB_CLIENT_EXTENDED_METADATA |
        MariaDBClientConstants.MARIADB_CLIENT_PROGRESS
    );
    strict.equal(handshake.authPluginName, 'mysql_native_password');
  });

  it('should treat the extended capability bytes as filler when CLIENT_MYSQL is set', () => {
    const handshake = Handshake.fromPacket(
      asPacket(
        buildHandshakePayload(
          mariadbServerCapabilities | ClientConstants.LONG_PASSWORD,
          MariaDBClientConstants.MARIADB_CLIENT_EXTENDED_METADATA
        )
      )
    );
    strict.equal(handshake.mariadbExtendedCapabilityFlags, 0);
    strict.equal(handshake.authPluginName, 'mysql_native_password');
  });
});

describe('HandshakeResponse / SSLRequest: MariaDB extended client capabilities', () => {
  const baseConfig = {
    user: 'testuser',
    database: 'testdb',
    password: 'testpass',
    flags:
      ClientConstants.PROTOCOL_41 |
      ClientConstants.SECURE_CONNECTION |
      ClientConstants.CONNECT_WITH_DB,
    charsetNumber: 224,
    authPluginData1: Buffer.alloc(8),
    authPluginData2: Buffer.alloc(12),
  };
  // 4 header + 4 client flags + 4 max packet size + 1 charset + 19 filler
  const extendedFlagsOffset = 4 + 4 + 4 + 1 + 19;

  it('should write extended client capabilities into the reserved bytes', () => {
    const response = new HandshakeResponse({
      ...baseConfig,
      mariadbExtendedClientFlags:
        MariaDBClientConstants.MARIADB_CLIENT_EXTENDED_METADATA,
    });
    const buffer = response.toPacket().buffer;
    strict.equal(
      buffer.readUInt32LE(extendedFlagsOffset),
      MariaDBClientConstants.MARIADB_CLIENT_EXTENDED_METADATA
    );
  });

  it('should leave the reserved bytes zeroed by default', () => {
    const response = new HandshakeResponse(baseConfig);
    const buffer = response.toPacket().buffer;
    strict.equal(buffer.readUInt32LE(extendedFlagsOffset), 0);
  });

  it('should write extended client capabilities into the SSL request', () => {
    const sslRequest = new SSLRequest(
      baseConfig.flags,
      baseConfig.charsetNumber,
      MariaDBClientConstants.MARIADB_CLIENT_EXTENDED_METADATA
    );
    const buffer = sslRequest.toPacket().buffer;
    strict.equal(
      buffer.readUInt32LE(extendedFlagsOffset),
      MariaDBClientConstants.MARIADB_CLIENT_EXTENDED_METADATA
    );
    strict.equal(buffer.length, 36);
  });
});

describe('ColumnDefinition: MariaDB extended metadata', () => {
  const buildColumnDefinitionPayload = (extendedMetadata?: Buffer): Buffer => {
    const fixed = Buffer.alloc(13);
    fixed[0] = 0x0c; // length of fixed fields
    fixed.writeUInt16LE(224, 1); // character set (utf8mb4)
    fixed.writeUInt32LE(144, 3); // column length
    fixed[7] = 0xfe; // column type (STRING)
    fixed.writeUInt16LE(128, 8); // flags (BINARY)
    fixed[10] = 0; // decimals
    return Buffer.concat([
      lenenc('def'),
      lenenc('test'),
      lenenc('t'),
      lenenc('t'),
      lenenc('u'),
      lenenc('u'),
      ...(extendedMetadata ? [lenenc(extendedMetadata)] : []),
      fixed,
    ]);
  };

  it('should parse extended type and format', () => {
    const extended = Buffer.concat([
      Buffer.from([0]), // data type: type name
      lenenc('uuid'),
      Buffer.from([1]), // data type: format
      lenenc('json'),
    ]);
    const column = new ColumnDefinition(
      asPacket(buildColumnDefinitionPayload(extended)),
      'utf8',
      true
    );
    strict.equal(column.extendedTypeName, 'uuid');
    strict.equal(column.extendedFormat, 'json');
    strict.equal(column.name, 'u');
    strict.equal(column.columnType, 0xfe);
    strict.equal(column.characterSet, 224);
    strict.equal(column.columnLength, 144);
    strict.equal(column.flags, 128);
  });

  it('should skip unknown extended metadata entries', () => {
    const extended = Buffer.concat([
      Buffer.from([7]), // unknown data type
      lenenc('future'),
      Buffer.from([0]),
      lenenc('inet6'),
    ]);
    const column = new ColumnDefinition(
      asPacket(buildColumnDefinitionPayload(extended)),
      'utf8',
      true
    );
    strict.equal(column.extendedTypeName, 'inet6');
    strict.equal(column.extendedFormat, undefined);
    strict.equal(column.columnType, 0xfe);
  });

  it('should resynchronise after a malformed extended metadata block', () => {
    // the value claims 200 bytes but the block only contains 2
    const extended = Buffer.concat([
      Buffer.from([0]),
      Buffer.from([200]),
      Buffer.from('ab'),
    ]);
    const column = new ColumnDefinition(
      asPacket(buildColumnDefinitionPayload(extended)),
      'utf8',
      true
    );
    strict.equal(column.name, 'u');
    strict.equal(column.columnType, 0xfe);
    strict.equal(column.characterSet, 224);
    strict.equal(column.columnLength, 144);
    strict.equal(column.flags, 128);
  });

  it('should parse an empty extended metadata block', () => {
    const column = new ColumnDefinition(
      asPacket(buildColumnDefinitionPayload(Buffer.alloc(0))),
      'utf8',
      true
    );
    strict.equal(column.extendedTypeName, undefined);
    strict.equal(column.extendedFormat, undefined);
    strict.equal(column.name, 'u');
    strict.equal(column.columnLength, 144);
  });

  it('should not consume extended metadata when not negotiated', () => {
    const column = new ColumnDefinition(
      asPacket(buildColumnDefinitionPayload()),
      'utf8',
      false
    );
    strict.equal(column.extendedTypeName, undefined);
    strict.equal(column.extendedFormat, undefined);
    strict.equal(column.name, 'u');
    strict.equal(column.columnLength, 144);
  });
});
