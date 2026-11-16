import type {
  QueryOptions,
  RowDataPacket,
  TypeCastField,
  TypeCastNext,
} from '../../../promise.js';
import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import parserCache from '../../../lib/parsers/parser_cache.js';
import { config, createConnection } from '../../common.test.mjs';

type Row = RowDataPacket & { s: unknown };

const { getParser } = parserCache;
let compiles = 0;
parserCache.getParser = (type, fields, options, parserConfig, compiler) =>
  getParser(type, fields, options, parserConfig, (...args: unknown[]) => {
    compiles++;
    return compiler(...args);
  });

const upperCase = (field: TypeCastField, next: TypeCastNext) =>
  field.type === 'VAR_STRING' ? field.string()?.toUpperCase() : next();

const cases: [string, Partial<QueryOptions>, unknown][] = [
  ['no typeCast', {}, 'MYSQL2'],
  ['typeCast undefined', { typeCast: undefined }, 'MYSQL2'],
  ['typeCast true', { typeCast: true }, 'mysql2'],
  ['typeCast false', { typeCast: false }, Buffer.from('mysql2')],
];

const repeats = 50;

await describe('A query typeCast against a connection typeCast function', async () => {
  const connection = createConnection({ typeCast: upperCase }).promise();
  const expectedCompiles = config.disableEval ? 0 : 1;

  const methods: [
    string,
    (options: QueryOptions) => Promise<[Row[], unknown]>,
  ][] = [
    ['query', (options) => connection.query<Row[]>(options)],
    ['execute', (options) => connection.execute<Row[]>(options)],
  ];

  for (const [method, run] of methods) {
    for (const [label, overrides, expected] of cases) {
      await it(`${method}() with ${label} compiles one row parser over repeated calls`, async () => {
        parserCache.clearCache();
        compiles = 0;
        const values: unknown[] = [];
        for (let i = 0; i < repeats; i++) {
          const [rows] = await run({
            sql: "SELECT 'mysql2' AS s",
            ...overrides,
          });
          values.push(rows[0].s);
        }

        strict.equal(compiles, expectedCompiles, 'compiled row parsers');
        strict.deepEqual(
          values,
          new Array(repeats).fill(expected),
          'row values'
        );
      });
    }
  }

  await connection.end();
});

parserCache.getParser = getParser;
