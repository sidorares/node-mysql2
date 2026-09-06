import type { TypeCastField, TypeCastNext } from '../../../index.js';
import { describe, it, strict } from 'poku';
import {
  _Entry,
  _hashKey,
  clearCache,
  getParser,
  setMaxCache,
} from '../../../lib/parsers/parser_cache.js';

interface CacheField {
  name: string;
  columnType: number;
  schema?: string;
  table: string;
  flags: number;
  characterSet: number;
  decimals: number;
  extendedTypeName?: string;
  extendedFormat?: string;
}

interface CacheOptions {
  nestTables?: boolean | string;
  rowsAsArray?: boolean | number;
  supportBigNumbers?: boolean | string;
  bigNumberStrings?: boolean | unknown[];
  typeCast?:
    boolean | number | ((field: TypeCastField, next: TypeCastNext) => unknown);
  timezone?: string;
  decimalNumbers?: boolean | object;
  dateStrings?: boolean | string | string[];
}

interface CacheConfig {
  supportBigNumbers?: boolean;
  bigNumberStrings?: boolean;
  timezone?: string;
  jsonStrings?: boolean;
  dateStrings?: boolean | string[];
}

interface Input {
  type: string;
  fields: CacheField[];
  options: CacheOptions;
  config: CacheConfig;
}

const idField: CacheField = {
  name: 'id',
  columnType: 3,
  schema: 'test',
  table: 'test',
  flags: 16899,
  characterSet: 63,
  decimals: 0,
};

const valueField: CacheField = {
  name: 'value',
  columnType: 246,
  schema: 'test',
  table: 'test',
  flags: 0,
  characterSet: 63,
  decimals: 2,
};

const baseOptions: CacheOptions = {
  nestTables: false,
  rowsAsArray: false,
  supportBigNumbers: false,
  bigNumberStrings: false,
  typeCast: true,
  timezone: 'local',
  decimalNumbers: false,
  dateStrings: false,
};

const baseConfig: CacheConfig = {
  supportBigNumbers: false,
  bigNumberStrings: false,
  timezone: 'local',
  jsonStrings: false,
};

const base: Input = {
  type: 'binary',
  fields: [idField, valueField],
  options: baseOptions,
  config: baseConfig,
};

// Every compiled parser is a fresh object, so two inputs share a cache
// entry exactly when getParser returns the same object for both.
const compile = (input: Input) =>
  getParser(input.type, input.fields, input.options, input.config, () => ({
    compiledFor: input,
  }));

const sharesParser = (a: Input, b: Input): boolean => {
  clearCache();
  const shared = compile(a) === compile(b);
  clearCache();
  return shared;
};

describe('Parser cache', () => {
  it('reuses the parser for identical input', () => {
    strict.equal(sharesParser(base, { ...base }), true);
    strict.equal(
      sharesParser(base, {
        ...base,
        fields: [{ ...idField }, { ...valueField }],
      }),
      true,
      'equal metadata on fresh column objects'
    );
  });

  it('normalizes option values to the behaviour the generated code depends on', () => {
    strict.equal(
      sharesParser(
        { ...base, fields: [idField] },
        {
          ...base,
          fields: [idField],
          options: {
            nestTables: undefined,
            rowsAsArray: undefined,
            supportBigNumbers: undefined,
            bigNumberStrings: undefined,
            typeCast: true,
            timezone: 'local',
            decimalNumbers: undefined,
            dateStrings: undefined,
          },
          config: { supportBigNumbers: undefined, bigNumberStrings: undefined },
        }
      ),
      true,
      'undefined and false are the same behaviour'
    );
    strict.equal(
      sharesParser(
        {
          ...base,
          options: {
            ...baseOptions,
            rowsAsArray: 2,
            supportBigNumbers: 'yes',
            bigNumberStrings: [],
            decimalNumbers: { a: null },
            dateStrings: 'DATETIME',
          },
        },
        {
          ...base,
          options: {
            ...baseOptions,
            rowsAsArray: true,
            supportBigNumbers: true,
            bigNumberStrings: true,
            decimalNumbers: true,
            dateStrings: true,
          },
        }
      ),
      true,
      'truthy values normalize to true'
    );
    strict.equal(
      sharesParser(base, { ...base, options: { ...baseOptions, typeCast: 1 } }),
      true,
      'a non-boolean, non-function typeCast is the default behaviour'
    );
    strict.equal(
      sharesParser(
        { ...base, options: { ...baseOptions, timezone: undefined } },
        { ...base, config: { ...baseConfig, timezone: 'local' } }
      ),
      true,
      'the config timezone applies when the query has none'
    );
  });

  it('separates every option the generated code depends on', () => {
    const variants: [string, CacheOptions, CacheConfig][] = [
      ['nestTables true', { ...baseOptions, nestTables: true }, baseConfig],
      ['nestTables string', { ...baseOptions, nestTables: '_' }, baseConfig],
      [
        'nestTables empty string',
        { ...baseOptions, nestTables: '' },
        baseConfig,
      ],
      ['rowsAsArray', { ...baseOptions, rowsAsArray: true }, baseConfig],
      [
        'supportBigNumbers',
        { ...baseOptions, supportBigNumbers: true },
        baseConfig,
      ],
      [
        'bigNumberStrings',
        { ...baseOptions, bigNumberStrings: true },
        baseConfig,
      ],
      ['typeCast false', { ...baseOptions, typeCast: false }, baseConfig],
      [
        'typeCast function',
        {
          ...baseOptions,
          typeCast: (_: TypeCastField, next: TypeCastNext) => next(),
        },
        baseConfig,
      ],
      ['timezone', { ...baseOptions, timezone: 'Z' }, baseConfig],
      ['decimalNumbers', { ...baseOptions, decimalNumbers: true }, baseConfig],
      ['dateStrings', { ...baseOptions, dateStrings: true }, baseConfig],
      [
        'dateStrings list',
        { ...baseOptions, dateStrings: ['DATE'] },
        baseConfig,
      ],
      [
        'dateStrings other list',
        { ...baseOptions, dateStrings: ['DATETIME'] },
        baseConfig,
      ],
      [
        'dateStrings longer list',
        { ...baseOptions, dateStrings: ['DATE', 'DATETIME'] },
        baseConfig,
      ],
      ['config jsonStrings', baseOptions, { ...baseConfig, jsonStrings: true }],
    ];
    const inputs: Input[] = variants.map(([, options, config]) => ({
      ...base,
      options,
      config,
    }));
    inputs.push({ ...base, type: 'text' });
    for (let i = 0; i < inputs.length; i++) {
      strict.equal(
        sharesParser(base, inputs[i]),
        false,
        variants[i] ? variants[i][0] : 'protocol'
      );
      for (let j = i + 1; j < inputs.length; j++) {
        strict.equal(
          sharesParser(inputs[i], inputs[j]),
          false,
          `${variants[i] ? variants[i][0] : 'protocol'} vs ${variants[j] ? variants[j][0] : 'protocol'}`
        );
      }
    }
  });

  it('treats a connection-level option like the same query-level option', () => {
    const pairs: [string, CacheOptions, CacheConfig][] = [
      [
        'supportBigNumbers',
        { ...baseOptions, supportBigNumbers: true },
        { ...baseConfig, supportBigNumbers: true },
      ],
      [
        'bigNumberStrings',
        { ...baseOptions, bigNumberStrings: true },
        { ...baseConfig, bigNumberStrings: true },
      ],
      [
        'dateStrings',
        { ...baseOptions, dateStrings: ['DATE'] },
        { ...baseConfig, dateStrings: ['DATE'] },
      ],
    ];
    for (const [name, options, config] of pairs) {
      strict.equal(
        sharesParser({ ...base, options }, { ...base, config }),
        true,
        name
      );
      strict.equal(sharesParser(base, { ...base, config }), false, name);
    }
  });

  it('separates every column property the generated code depends on', () => {
    const variants: [string, CacheField][] = [
      ['name', { ...valueField, name: 'other' }],
      ['columnType', { ...valueField, columnType: 253 }],
      ['characterSet', { ...valueField, characterSet: 224 }],
      ['flags', { ...valueField, flags: 32 }],
      ['decimals', { ...valueField, decimals: 6 }],
      ['extendedTypeName', { ...valueField, extendedTypeName: 'uuid' }],
      ['extendedFormat', { ...valueField, extendedFormat: 'json' }],
    ];
    for (const [name, field] of variants) {
      strict.equal(
        sharesParser(base, { ...base, fields: [idField, field] }),
        false,
        name
      );
    }
    strict.equal(
      sharesParser(base, { ...base, fields: [valueField, idField] }),
      false,
      'column order'
    );
    strict.equal(
      sharesParser(base, { ...base, fields: [idField] }),
      false,
      'column count'
    );
  });

  it('includes the table name only when rows are nested by table', () => {
    const otherTable: CacheField = { ...valueField, table: 'other' };
    strict.equal(
      sharesParser(base, { ...base, fields: [idField, otherTable] }),
      true,
      'flat rows do not depend on the table name'
    );
    for (const nestTables of [true, '_', '']) {
      strict.equal(
        sharesParser(
          { ...base, options: { ...baseOptions, nestTables } },
          {
            ...base,
            fields: [idField, otherTable],
            options: { ...baseOptions, nestTables },
          }
        ),
        false,
        `nestTables ${JSON.stringify(nestTables)}`
      );
    }
  });

  it('ignores column properties the generated code never reads', () => {
    strict.equal(
      sharesParser(base, {
        ...base,
        fields: [{ ...idField, schema: 'other' }, valueField],
      }),
      true,
      'schema'
    );
  });

  it('confirms every part of the metadata when a bucket entry is checked', () => {
    const listOptions: CacheOptions = { ...baseOptions, dateStrings: ['DATE'] };
    const entry = new _Entry(
      {},
      'binary',
      [idField, valueField],
      listOptions,
      baseConfig
    );
    const matches = (
      type: string,
      fields: CacheField[],
      options: CacheOptions,
      config: CacheConfig
    ): boolean => entry.matches(type, fields, options, config);

    strict.equal(
      matches('binary', [idField, valueField], listOptions, baseConfig),
      true
    );
    strict.equal(
      matches(
        'binary',
        [{ ...idField }, { ...valueField }],
        listOptions,
        baseConfig
      ),
      true,
      'fresh column objects with equal metadata'
    );
    strict.equal(
      matches('text', [idField, valueField], listOptions, baseConfig),
      false,
      'protocol'
    );
    strict.equal(
      matches(
        'binary',
        [idField, valueField],
        { ...listOptions, nestTables: '_' },
        baseConfig
      ),
      false,
      'nestTables'
    );
    strict.equal(
      matches(
        'binary',
        [idField, valueField],
        { ...listOptions, timezone: 'Z' },
        baseConfig
      ),
      false,
      'timezone'
    );
    strict.equal(
      matches('binary', [idField], listOptions, baseConfig),
      false,
      'column count'
    );
    strict.equal(
      matches(
        'binary',
        [idField, valueField],
        { ...listOptions, dateStrings: ['DATETIME'] },
        baseConfig
      ),
      false,
      'dateStrings list contents'
    );
    strict.equal(
      matches(
        'binary',
        [idField, valueField],
        { ...listOptions, dateStrings: ['DATE', 'DATETIME'] },
        baseConfig
      ),
      false,
      'dateStrings list length'
    );
    strict.equal(
      matches(
        'binary',
        [idField, valueField],
        { ...listOptions, dateStrings: true },
        baseConfig
      ),
      false,
      'dateStrings list against boolean'
    );
    for (const [name, field] of [
      ['name', { ...valueField, name: 'other' }],
      ['columnType', { ...valueField, columnType: 253 }],
      ['characterSet', { ...valueField, characterSet: 224 }],
      ['flags', { ...valueField, flags: 32 }],
      ['decimals', { ...valueField, decimals: 6 }],
      ['extendedTypeName', { ...valueField, extendedTypeName: 'uuid' }],
      ['extendedFormat', { ...valueField, extendedFormat: 'json' }],
    ] as [string, CacheField][]) {
      strict.equal(
        matches('binary', [idField, field], listOptions, baseConfig),
        false,
        name
      );
    }

    const nested = new _Entry(
      {},
      'text',
      [idField, valueField],
      { ...baseOptions, nestTables: true },
      baseConfig
    );
    strict.equal(
      nested.matches(
        'text',
        [idField, { ...valueField, table: 'other' }],
        { ...baseOptions, nestTables: true },
        baseConfig
      ),
      false,
      'table with nestTables'
    );
  });

  it('hashes columns without names or extended metadata', () => {
    const unnamed: CacheField = {
      ...idField,
      name: undefined as unknown as string,
    };
    strict.equal(
      typeof _hashKey('text', [unnamed], baseOptions, baseConfig),
      'number'
    );
    strict.notEqual(
      _hashKey('text', [unnamed], baseOptions, baseConfig),
      _hashKey('text', [idField], baseOptions, baseConfig)
    );
  });

  it('resizes the cache through setMaxCache', () => {
    clearCache();
    const first = compile(base);
    setMaxCache(1);
    strict.equal(
      compile(base),
      first,
      'the entry survives a resize that keeps it'
    );
    compile({ ...base, type: 'text' });
    strict.notEqual(
      compile(base),
      first,
      'the oldest entry is evicted at capacity'
    );
    setMaxCache(15000);
    clearCache();
  });

  it('confirms the full metadata on a hash collision', () => {
    const hashFor = (name: string): number =>
      _hashKey('text', [{ ...idField, name }], baseOptions, baseConfig);
    const seen = new Map<number, string>();
    let collision: [string, string] | undefined;
    for (let i = 0; collision === undefined; i++) {
      const name = `c${i.toString(36)}`;
      const hash = hashFor(name);
      const previous = seen.get(hash);
      if (previous !== undefined) {
        collision = [previous, name];
      }
      seen.set(hash, name);
    }
    const [nameA, nameB] = collision;
    strict.equal(hashFor(nameA), hashFor(nameB));
    strict.equal(
      sharesParser(
        { ...base, type: 'text', fields: [{ ...idField, name: nameA }] },
        { ...base, type: 'text', fields: [{ ...idField, name: nameB }] }
      ),
      false,
      `${nameA} and ${nameB} share a hash but must not share a parser`
    );
  });
});
