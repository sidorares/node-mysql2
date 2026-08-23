import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Packet from '../../../lib/packets/packet.js';
import getBinaryParser from '../../../lib/parsers/binary_parser.js';
import getStaticBinaryParser from '../../../lib/parsers/static_binary_parser.js';
import getStaticTextParser from '../../../lib/parsers/static_text_parser.js';
import getTextParser from '../../../lib/parsers/text_parser.js';

// With supportBigNumbers, integers inside JSON documents that cannot be
// accurately represented as JavaScript Numbers must arrive as exact
// String objects (mirroring BIGINT column behaviour) instead of being
// silently rounded by JSON.parse. Exactness requires JSON.parse source
// access (Node.js 22+); older runtimes keep plain JSON.parse behaviour.
const sourceAccessSupported = (() => {
  let supported = false;
  JSON.parse('0', (_key: unknown, value: unknown, context?: unknown) => {
    supported =
      context !== undefined &&
      typeof (context as { source?: unknown }).source === 'string';
    return value;
  });
  return supported;
})();

// 9007199254740993 exceeds Number.MAX_SAFE_INTEGER; JSON.parse rounds it
// to 9007199254740992. Safe integers, floats (including unsafe-magnitude
// decimals and exponent notation, which stay lossy doubles), numeric
// strings and nulls must pass through untouched.
const raw = Buffer.from(
  '{"big": 9007199254740993, "neg": -9007199254740993, ' +
    '"safe": 42, "float": 1.5, "dec": 9007199254740993.5, ' +
    '"exp": 9e30, "str": "9007199254740993", "nil": null}',
  'utf8'
);
strict.ok(raw.length < 251);

const exactValue = {
  big: '9007199254740993',
  neg: '-9007199254740993',
  safe: 42,
  float: 1.5,
  dec: 9007199254740994, // 9007199254740993.5 rounds to this double in both modes
  exp: 9e30,
  str: '9007199254740993',
  nil: null,
};

const roundedValue = {
  big: 9007199254740992,
  neg: -9007199254740992,
  safe: 42,
  float: 1.5,
  dec: 9007199254740994, // 9007199254740993.5 rounds to this double in both modes
  exp: 9e30,
  str: '9007199254740993',
  nil: null,
};

const expected = sourceAccessSupported ? exactValue : roundedValue;

// JSON columns can hold bare scalars too; the reviver must handle the
// root value (key '') like any other
const rawRootScalar = Buffer.from('9007199254740993', 'utf8');
const expectedRootScalar = sourceAccessSupported
  ? '9007199254740993'
  : 9007199254740992;
const rawRootNull = Buffer.from('null', 'utf8');

// MySQL JSON column (charset 63/BINARY, decoded as utf8)
const mysqlJsonField = {
  name: 'j',
  columnType: 0xf5, // JSON
  characterSet: 63,
  encoding: 'binary',
  flags: 144,
  decimals: 0,
  columnLength: 4294967295,
  schema: 'test',
  table: 't',
  orgName: 'j',
  orgTable: 't',
};

// MariaDB JSON column: LONG_BLOB identified via extended metadata
const mariadbJsonField = {
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

const options = {};

// the compiled row classes are untyped internals
const jsonOf = (row: object): unknown => (row as { j: unknown }).j;

for (const [label, field] of [
  ['MySQL JSON', mysqlJsonField],
  ['MariaDB extended-format JSON', mariadbJsonField],
] as const) {
  const fields = [field];

  describe(`supportBigNumbers inside ${label} values`, () => {
    it('text parser returns unsafe integers exactly', () => {
      const Parser = getTextParser(fields, options, {
        supportBigNumbers: true,
      });
      const row = new Parser(fields).next(textRowPacket(), fields, options);
      strict.deepEqual(jsonOf(row), expected);
    });

    it('binary parser returns unsafe integers exactly', () => {
      const Parser = getBinaryParser(fields, options, {
        supportBigNumbers: true,
      });
      const row = new Parser().next(binaryRowPacket(), fields, options);
      strict.deepEqual(jsonOf(row), expected);
    });

    it('static text parser returns unsafe integers exactly', () => {
      const parser = getStaticTextParser(fields, options, {
        supportBigNumbers: true,
      });
      const row = parser.next(textRowPacket(), fields, options);
      strict.deepEqual(jsonOf(row), expected);
    });

    it('static binary parser returns unsafe integers exactly', () => {
      const Parser = getStaticBinaryParser(fields, options, {
        supportBigNumbers: true,
      });
      const row = new Parser().next(binaryRowPacket(), fields, options);
      strict.deepEqual(jsonOf(row), expected);
    });

    it('without supportBigNumbers keeps plain JSON.parse behaviour', () => {
      const Parser = getTextParser(fields, options, {});
      const row = new Parser(fields).next(textRowPacket(), fields, options);
      strict.deepEqual(jsonOf(row), roundedValue);
    });

    it('jsonStrings still returns the raw (always exact) text', () => {
      const Parser = getTextParser(fields, options, {
        supportBigNumbers: true,
        jsonStrings: true,
      });
      const row = new Parser(fields).next(textRowPacket(), fields, options);
      strict.equal(jsonOf(row), raw.toString('utf8'));
    });

    it('handles a bare unsafe integer as the root value', () => {
      const Parser = getTextParser(fields, options, {
        supportBigNumbers: true,
      });
      const row = new Parser(fields).next(
        textRowPacket(rawRootScalar),
        fields,
        options
      );
      strict.equal(jsonOf(row), expectedRootScalar);
    });

    it('handles a JSON null root value', () => {
      const Parser = getTextParser(fields, options, {
        supportBigNumbers: true,
      });
      const row = new Parser(fields).next(
        textRowPacket(rawRootNull),
        fields,
        options
      );
      strict.equal(jsonOf(row), null);
    });
  });
}
