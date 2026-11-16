import type { TypeCastField, TypeCastNext } from '../../../index.js';
import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import ConnectionConfig from '../../../lib/connection_config.js';
import Packet from '../../../lib/packets/packet.js';
import getBinaryParser from '../../../lib/parsers/binary_parser.js';
import { clearCache } from '../../../lib/parsers/parser_cache.js';
import getStaticBinaryParser from '../../../lib/parsers/static_binary_parser.js';
import getStaticTextParser from '../../../lib/parsers/static_text_parser.js';
import getTextParser from '../../../lib/parsers/text_parser.js';

const value = Buffer.from('mysql2', 'utf8');

const fields = [
  {
    name: 's',
    columnType: 0xfd, // VAR_STRING
    characterSet: 224,
    encoding: 'utf8',
    flags: 0,
    decimals: 0,
    columnLength: 24,
    schema: 'test',
    table: 't',
    orgName: 's',
    orgTable: 't',
  },
];

const textRowPacket = () => {
  const buf = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from([value.length]),
    value,
  ]);
  return new Packet(0, buf, 0, buf.length);
};

const binaryRowPacket = () => {
  const buf = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from([0]), // status byte
    Buffer.from([0]), // null bitmap
    Buffer.from([value.length]),
    value,
  ]);
  return new Packet(0, buf, 0, buf.length);
};

const upperCase = (field: TypeCastField, next: TypeCastNext) =>
  field.type === 'VAR_STRING' ? field.string()?.toUpperCase() : next();

const tagged = (field: TypeCastField) => `query:${field.string()}`;

const config = new ConnectionConfig({ typeCast: upperCase });

const cases: [string, object, unknown][] = [
  ['no typeCast', {}, 'MYSQL2'],
  ['typeCast undefined', { typeCast: undefined }, 'MYSQL2'],
  ['typeCast null', { typeCast: null }, 'MYSQL2'],
  ['typeCast true', { typeCast: true }, 'mysql2'],
  ['typeCast false', { typeCast: false }, value],
  ['a typeCast function', { typeCast: tagged }, 'query:mysql2'],
];

type Options = ReturnType<typeof ConnectionConfig.queryOptions>;

const parsers: [string, (options: Options) => object][] = [
  [
    'text',
    (options) =>
      new (getTextParser(fields, options, config))(fields).next(
        textRowPacket(),
        fields,
        options
      ),
  ],
  [
    'binary',
    (options) =>
      new (getBinaryParser(fields, options, config))().next(
        binaryRowPacket(),
        fields,
        options
      ),
  ],
  [
    'static text',
    (options) =>
      getStaticTextParser(fields, options, config).next(
        textRowPacket(),
        fields,
        options
      ),
  ],
  [
    'static binary',
    (options) =>
      new (getStaticBinaryParser(fields, options, config))().next(
        binaryRowPacket(),
        fields,
        options
      ),
  ],
];

const compilers: [string, typeof getTextParser][] = [
  ['text', getTextParser],
  ['binary', getBinaryParser],
];

// the row classes are untyped internals
const columnOf = (row: object): unknown => (row as { s: unknown }).s;

describe('A query typeCast against a connection typeCast function', () => {
  it('reaches every row parser as the same effective typeCast', () => {
    for (const [label, overrides, expected] of cases) {
      for (const [name, parse] of parsers) {
        strict.deepEqual(
          columnOf(parse(ConnectionConfig.queryOptions(config, overrides))),
          expected,
          `${name} parser, ${label}`
        );
      }
    }
    clearCache();
  });

  it('compiles one parser for repeated queries and leaves their options untouched', () => {
    for (const [label, overrides] of cases) {
      for (const [name, compile] of compilers) {
        clearCache();
        const options = ConnectionConfig.queryOptions(config, overrides);
        const before = { ...options };
        const compiled = new Set([compile(fields, options, config)]);
        strict.deepEqual(options, before, `${name} parser, ${label}: options`);
        for (let i = 1; i < 50; i++) {
          compiled.add(
            compile(
              fields,
              ConnectionConfig.queryOptions(config, overrides),
              config
            )
          );
        }
        strict.equal(compiled.size, 1, `${name} parser, ${label}: compiles`);
      }
    }
    clearCache();
  });
});
