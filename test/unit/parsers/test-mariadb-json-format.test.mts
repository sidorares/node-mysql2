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

// A binary column (BLOB, VARBINARY) with a json_valid check is flagged as
// JSON too, with the BINARY charset
const binaryJsonField = {
  ...jsonField,
  characterSet: 63,
  encoding: 'binary',
};

const value = { tag: 'x', nums: [1, 2, 3] };
const raw = Buffer.from(JSON.stringify(value), 'utf8');
strict.ok(raw.length < 251);

const nonAsciiValue = { s: 'café ☕' };
const nonAsciiRaw = Buffer.from(JSON.stringify(nonAsciiValue), 'utf8');

const textRowPacket = (payload = raw) => {
  const buf = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from([payload.length]),
    payload,
  ]);
  return new Packet(0, buf, 0, buf.length);
};

const binaryRowPacket = (payload = raw) => {
  const buf = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from([0]), // status byte
    Buffer.from([0]), // null bitmap
    Buffer.from([payload.length]),
    payload,
  ]);
  return new Packet(0, buf, 0, buf.length);
};

const fields = [jsonField];
const options = {};
const jsonStrings = { jsonStrings: true };

// the compiled row classes are untyped internals
const jsonOf = (row: object): unknown => (row as { j: unknown }).j;

describe('MariaDB extended JSON format parsing', () => {
  it('text parser should parse JSON-formatted columns', () => {
    const Parser = getTextParser(fields, options, {});
    const row = new Parser(fields).next(textRowPacket(), fields, options);
    strict.deepEqual(jsonOf(row), value);
  });

  it('text parser should respect jsonStrings', () => {
    const Parser = getTextParser(fields, jsonStrings, jsonStrings);
    const row = new Parser(fields).next(textRowPacket(), fields, jsonStrings);
    strict.equal(jsonOf(row), JSON.stringify(value));
  });

  it('binary parser should parse JSON-formatted columns', () => {
    const Parser = getBinaryParser(fields, options, {});
    const row = new Parser().next(binaryRowPacket(), fields, options);
    strict.deepEqual(jsonOf(row), value);
  });

  it('binary parser should respect jsonStrings', () => {
    const Parser = getBinaryParser(fields, jsonStrings, jsonStrings);
    const row = new Parser().next(binaryRowPacket(), fields, jsonStrings);
    strict.equal(jsonOf(row), JSON.stringify(value));
  });

  it('static text parser should parse JSON-formatted columns', () => {
    const parser = getStaticTextParser(fields, options, {});
    const row = parser.next(textRowPacket(), fields, options);
    strict.deepEqual(jsonOf(row), value);
  });

  it('static text parser should respect jsonStrings', () => {
    const parser = getStaticTextParser(fields, jsonStrings, jsonStrings);
    const row = parser.next(textRowPacket(), fields, jsonStrings);
    strict.equal(jsonOf(row), JSON.stringify(value));
  });

  it('static binary parser should parse JSON-formatted columns', () => {
    const Parser = getStaticBinaryParser(fields, options, {});
    const row = new Parser().next(binaryRowPacket(), fields, options);
    strict.deepEqual(jsonOf(row), value);
  });

  it('static binary parser should respect jsonStrings', () => {
    const Parser = getStaticBinaryParser(fields, jsonStrings, jsonStrings);
    const row = new Parser().next(binaryRowPacket(), fields, jsonStrings);
    strict.equal(jsonOf(row), JSON.stringify(value));
  });
});

describe('MariaDB extended JSON format parsing in a binary column', () => {
  const binaryFields = [binaryJsonField];

  for (const jsonStrings of [false, true]) {
    const queryOptions = { jsonStrings };
    const expected = jsonStrings
      ? JSON.stringify(nonAsciiValue)
      : nonAsciiValue;
    const mode = jsonStrings ? 'with jsonStrings' : 'when parsing';

    it(`text parser should decode UTF-8 ${mode}`, () => {
      const Parser = getTextParser(binaryFields, queryOptions, queryOptions);
      const row = new Parser(binaryFields).next(
        textRowPacket(nonAsciiRaw),
        binaryFields,
        queryOptions
      );
      strict.deepEqual(jsonOf(row), expected);
    });

    it(`binary parser should decode UTF-8 ${mode}`, () => {
      const Parser = getBinaryParser(binaryFields, queryOptions, queryOptions);
      const row = new Parser().next(
        binaryRowPacket(nonAsciiRaw),
        binaryFields,
        queryOptions
      );
      strict.deepEqual(jsonOf(row), expected);
    });

    it(`static text parser should decode UTF-8 ${mode}`, () => {
      const parser = getStaticTextParser(
        binaryFields,
        queryOptions,
        queryOptions
      );
      const row = parser.next(
        textRowPacket(nonAsciiRaw),
        binaryFields,
        queryOptions
      );
      strict.deepEqual(jsonOf(row), expected);
    });

    it(`static binary parser should decode UTF-8 ${mode}`, () => {
      const Parser = getStaticBinaryParser(
        binaryFields,
        queryOptions,
        queryOptions
      );
      const row = new Parser().next(
        binaryRowPacket(nonAsciiRaw),
        binaryFields,
        queryOptions
      );
      strict.deepEqual(jsonOf(row), expected);
    });
  }
});
