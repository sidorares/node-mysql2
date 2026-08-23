import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Packet from '../../../lib/packets/packet.js';
import getBinaryParser from '../../../lib/parsers/binary_parser.js';
import getStaticBinaryParser from '../../../lib/parsers/static_binary_parser.js';
import getStaticTextParser from '../../../lib/parsers/static_text_parser.js';
import getTextParser from '../../../lib/parsers/text_parser.js';

// MariaDB sends JSON columns as LONG_BLOB with utf8mb4 charset; only the
// extended metadata (extendedFormat) identifies them as JSON
const jsonField = {
  name: 'j',
  columnType: 0xfb, // LONG_BLOB
  characterSet: 224,
  encoding: 'utf8',
  flags: 144,
  decimals: 39,
  columnLength: 4294967295,
  schema: 'test',
  table: 't',
  orgName: 'j',
  orgTable: 't',
  extendedTypeName: undefined,
  extendedFormat: 'json',
};

const value = { tag: 'x', nums: [1, 2, 3] };
const raw = Buffer.from(JSON.stringify(value), 'utf8');
strict.ok(raw.length < 251);

const textRowPacket = () => {
  const buf = Buffer.concat([Buffer.alloc(4), Buffer.from([raw.length]), raw]);
  return new Packet(0, buf, 0, buf.length);
};

const binaryRowPacket = () => {
  const buf = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from([0]), // status byte
    Buffer.from([0]), // null bitmap
    Buffer.from([raw.length]),
    raw,
  ]);
  return new Packet(0, buf, 0, buf.length);
};

const fields = [jsonField];
const options = {};

// the compiled row classes are untyped internals
const jsonOf = (row: object): unknown => (row as { j: unknown }).j;

describe('MariaDB extended JSON format parsing', () => {
  it('text parser should parse JSON-formatted columns', () => {
    const Parser = getTextParser(fields, options, {});
    const row = new Parser(fields).next(textRowPacket(), fields, options);
    strict.deepEqual(jsonOf(row), value);
  });

  it('text parser should respect jsonStrings', () => {
    const Parser = getTextParser(fields, options, { jsonStrings: true });
    const row = new Parser(fields).next(textRowPacket(), fields, options);
    strict.equal(jsonOf(row), JSON.stringify(value));
  });

  it('binary parser should parse JSON-formatted columns', () => {
    const Parser = getBinaryParser(fields, options, {});
    const row = new Parser().next(binaryRowPacket(), fields, options);
    strict.deepEqual(jsonOf(row), value);
  });

  it('binary parser should respect jsonStrings', () => {
    const Parser = getBinaryParser(fields, options, { jsonStrings: true });
    const row = new Parser().next(binaryRowPacket(), fields, options);
    strict.equal(jsonOf(row), JSON.stringify(value));
  });

  it('static text parser should parse JSON-formatted columns', () => {
    const parser = getStaticTextParser(fields, options, {});
    const row = parser.next(textRowPacket(), fields, options);
    strict.deepEqual(jsonOf(row), value);
  });

  it('static text parser should respect jsonStrings', () => {
    const parser = getStaticTextParser(fields, options, {
      jsonStrings: true,
    });
    const row = parser.next(textRowPacket(), fields, options);
    strict.equal(jsonOf(row), JSON.stringify(value));
  });

  it('static binary parser should parse JSON-formatted columns', () => {
    const Parser = getStaticBinaryParser(fields, options, {});
    const row = new Parser().next(binaryRowPacket(), fields, options);
    strict.deepEqual(jsonOf(row), value);
  });

  it('static binary parser should respect jsonStrings', () => {
    const Parser = getStaticBinaryParser(fields, options, {
      jsonStrings: true,
    });
    const row = new Parser().next(binaryRowPacket(), fields, options);
    strict.equal(jsonOf(row), JSON.stringify(value));
  });
});
