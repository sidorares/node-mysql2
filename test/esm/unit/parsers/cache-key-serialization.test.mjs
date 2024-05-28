import { assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { _keyFromFields } = require('../../../../lib/parsers/parser_cache.js');

// Invalid
const test1 = {
  type: undefined,
  fields: [
    {
      name: undefined,
      columnType: undefined,
      length: undefined,
      schema: undefined,
      table: undefined,
      flags: undefined,
      characterSet: undefined,
    },
  ],
  options: {
    nestTables: undefined,
    rowsAsArray: undefined,
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    typeCast: undefined,
    timezone: undefined,
    decimalNumbers: undefined,
    dateStrings: undefined,
  },
  config: {
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    timezone: undefined,
  },
};

// Invalid, except for `config` (global overwriting)
const test2 = {
  type: undefined,
  fields: [
    {
      name: undefined,
      columnType: undefined,
      length: undefined,
      schema: undefined,
      table: undefined,
      flags: undefined,
      characterSet: undefined,
    },
  ],
  options: {
    nestTables: undefined,
    rowsAsArray: undefined,
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    typeCast: undefined,
    timezone: undefined,
    decimalNumbers: undefined,
    dateStrings: undefined,
  },
  config: {
    supportBigNumbers: false,
    bigNumberStrings: false,
    timezone: 'local',
  },
};

// Invalid, except for options
const test3 = {
  type: undefined,
  fields: [
    {
      name: undefined,
      columnType: undefined,
      length: undefined,
      schema: undefined,
      table: undefined,
      flags: undefined,
      characterSet: undefined,
    },
  ],
  options: {
    nestTables: '',
    rowsAsArray: false,
    supportBigNumbers: false,
    bigNumberStrings: false,
    typeCast: true,
    timezone: 'local',
    decimalNumbers: false,
    dateStrings: false,
  },
  config: {
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    timezone: undefined,
  },
};

// Based on results of `SELECT * FROM test WHERE value = ?`
const test4 = {
  type: 'binary',
  fields: [
    {
      name: 'id',
      columnType: '3',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '16899',
      characterSet: '63',
    },
    {
      name: 'value',
      columnType: '246',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '0',
      characterSet: '63',
    },
  ],
  options: {
    nestTables: false,
    rowsAsArray: false,
    supportBigNumbers: false,
    bigNumberStrings: false,
    typeCast: true,
    timezone: 'local',
    decimalNumbers: false,
    dateStrings: 'DATETIME',
  },
  config: {
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    timezone: undefined,
  },
};

// Same from test4, but with invalid booleans need to reach out the same key
const test5 = {
  type: 'binary',
  fields: [
    {
      name: 'id',
      columnType: '3',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '16899',
      characterSet: '63',
    },
    {
      name: 'value',
      columnType: '246',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '0',
      characterSet: '63',
    },
  ],
  options: {
    nestTables: false,
    rowsAsArray: undefined,
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    typeCast: true,
    timezone: 'local',
    decimalNumbers: undefined,
    dateStrings: 'DATETIME',
  },
  config: {
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    timezone: undefined,
  },
};

// Forcing delimiters on strings fields
// Checking for quotes escape
const test6 = {
  type: 'binary',
  fields: [
    {
      name: ':',
      columnType: '©',
      length: undefined,
      schema: '/',
      table: ',',
      flags: '_',
      characterSet: '❌',
    },
  ],
  options: {
    nestTables: false,
    rowsAsArray: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    typeCast: true,
    timezone: '""`\'',
    decimalNumbers: true,
    dateStrings: '#',
  },
  config: {
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    timezone: undefined,
  },
};

// valid with `true` on booleans
const test7 = {
  type: 'binary',
  fields: [
    {
      name: 'id',
      columnType: '3',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '16899',
      characterSet: '63',
    },
    {
      name: 'value',
      columnType: '246',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '0',
      characterSet: '63',
    },
  ],
  options: {
    nestTables: true,
    rowsAsArray: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    typeCast: true,
    timezone: 'local',
    decimalNumbers: true,
    dateStrings: 'DATETIME',
  },
  config: {
    supportBigNumbers: true,
    bigNumberStrings: true,
    timezone: true,
  },
};

// Expects the same result from test7, but using valid values instead of `true` on booleans fields
const test8 = {
  type: 'binary',
  fields: [
    {
      name: 'id',
      columnType: '3',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '16899',
      characterSet: '63',
    },
    {
      name: 'value',
      columnType: '246',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '0',
      characterSet: '63',
    },
  ],
  options: {
    nestTables: true,
    rowsAsArray: 2,
    supportBigNumbers: 'yes',
    bigNumberStrings: [],
    typeCast: true,
    timezone: 'local',
    decimalNumbers: {
      a: null,
    },
    dateStrings: 'DATETIME',
  },
  config: {
    supportBigNumbers: true,
    bigNumberStrings: true,
    timezone: true,
  },
};

// Invalid: checking function parser in wrong fields, expecting to be `null`
const test9 = {
  type: 'binary',
  fields: [
    {
      name: 'id',
      columnType: '3',
      length: undefined,
      schema: 'test',
      table: 'test',
      flags: '16899',
      characterSet: '63',
    },
  ],
  options: {
    nestTables: false,
    rowsAsArray: false,
    supportBigNumbers: false,
    // Expected: true
    bigNumberStrings: (_, next) => next(),
    // Expected: "function"
    typeCast: (_, next) => next(),
    timezone: 'local',
    decimalNumbers: false,
    // Expected: null
    dateStrings: (_, next) => next(),
  },
  config: {
    supportBigNumbers: undefined,
    bigNumberStrings: undefined,
    timezone: undefined,
  },
};

const result1 = _keyFromFields(
  test1.type,
  test1.fields,
  test1.options,
  test1.config,
);
const result2 = _keyFromFields(
  test2.type,
  test2.fields,
  test2.options,
  test2.config,
);
const result3 = _keyFromFields(
  test3.type,
  test3.fields,
  test3.options,
  test3.config,
);
const result4 = _keyFromFields(
  test4.type,
  test4.fields,
  test4.options,
  test4.config,
);
const result5 = _keyFromFields(
  test5.type,
  test5.fields,
  test5.options,
  test5.config,
);
const result6 = _keyFromFields(
  test6.type,
  test6.fields,
  test6.options,
  test6.config,
);
const result7 = _keyFromFields(
  test7.type,
  test7.fields,
  test7.options,
  test7.config,
);
const result8 = _keyFromFields(
  test8.type,
  test8.fields,
  test8.options,
  test8.config,
);
const result9 = _keyFromFields(
  test9.type,
  test9.fields,
  test9.options,
  test9.config,
);

assert.deepStrictEqual(
  result1,
  '[null,"undefined",null,false,false,false,"undefined",null,false,null,[null,null,null,null,null,null,null]]',
);
assert(JSON.parse(result1));

assert.deepStrictEqual(
  result2,
  '[null,"undefined",null,false,false,false,"undefined","local",false,null,[null,null,null,null,null,null,null]]',
);
assert(JSON.parse(result2));

assert.deepStrictEqual(
  result3,
  '[null,"string","",false,false,false,"boolean","local",false,false,[null,null,null,null,null,null,null]]',
);
assert(JSON.parse(result3));

assert.deepStrictEqual(
  result4,
  '["binary","boolean",false,false,false,false,"boolean","local",false,"DATETIME",["id","3",null,"test","test","16899","63"],["value","246",null,"test","test","0","63"]]',
);
assert(JSON.parse(result4));

assert.deepStrictEqual(result4, result5);
assert(JSON.parse(result5));

assert.deepStrictEqual(
  result6,
  '["binary","boolean",false,true,true,true,"boolean","\\"\\"`\'",true,"#",[":","©",null,"/",",","_","❌"]]',
);
// Ensuring that JSON is valid with invalid delimiters
assert(JSON.parse(result6));

assert.deepStrictEqual(
  result7,
  '["binary","boolean",true,true,true,true,"boolean","local",true,"DATETIME",["id","3",null,"test","test","16899","63"],["value","246",null,"test","test","0","63"]]',
);
assert(JSON.parse(result7));

assert.deepStrictEqual(result7, result8);
assert(JSON.parse(result8));

assert.deepStrictEqual(
  result9,
  '["binary","boolean",false,false,false,true,"function","local",false,null,["id","3",null,"test","test","16899","63"]]',
);
assert(JSON.parse(result9));
assert(JSON.parse(result9)[5] === true);
assert(JSON.parse(result9)[6] === 'function');
assert(JSON.parse(result9)[9] === null);

// Testing twice all existent tests needs to return 7 keys, since two of them expects to be the same
assert(
  Array.from(
    new Set([
      _keyFromFields(test1.type, test1.fields, test1.options, test1.config),
      _keyFromFields(test1.type, test1.fields, test1.options, test1.config),
      _keyFromFields(test2.type, test2.fields, test2.options, test2.config),
      _keyFromFields(test2.type, test2.fields, test2.options, test2.config),
      _keyFromFields(test3.type, test3.fields, test3.options, test3.config),
      _keyFromFields(test3.type, test3.fields, test3.options, test3.config),
      _keyFromFields(test4.type, test4.fields, test4.options, test4.config),
      _keyFromFields(test4.type, test4.fields, test4.options, test4.config),
      _keyFromFields(test5.type, test5.fields, test5.options, test5.config),
      _keyFromFields(test5.type, test5.fields, test5.options, test5.config),
      _keyFromFields(test6.type, test6.fields, test6.options, test6.config),
      _keyFromFields(test6.type, test6.fields, test6.options, test6.config),
      _keyFromFields(test7.type, test7.fields, test7.options, test7.config),
      _keyFromFields(test7.type, test7.fields, test7.options, test7.config),
      _keyFromFields(test8.type, test8.fields, test8.options, test8.config),
      _keyFromFields(test8.type, test8.fields, test8.options, test8.config),
      _keyFromFields(test9.type, test9.fields, test9.options, test9.config),
      _keyFromFields(test9.type, test9.fields, test9.options, test9.config),
    ]),
  ).length === 7,
);

const stringify = JSON.stringify;

// Overwriting the native `JSON.stringify`
JSON.stringify = (value, replacer, space = 8) =>
  stringify(value, replacer, space);

// Testing twice all existent tests needs to return 7 keys, since two of them expects to be the same
assert(
  Array.from(
    new Set([
      result1,
      _keyFromFields(test1.type, test1.fields, test1.options, test1.config),
      result2,
      _keyFromFields(test2.type, test2.fields, test2.options, test2.config),
      result3,
      _keyFromFields(test3.type, test3.fields, test3.options, test3.config),
      result4,
      _keyFromFields(test4.type, test4.fields, test4.options, test4.config),
      result5,
      _keyFromFields(test5.type, test5.fields, test5.options, test5.config),
      result6,
      _keyFromFields(test6.type, test6.fields, test6.options, test6.config),
      result7,
      _keyFromFields(test7.type, test7.fields, test7.options, test7.config),
      result8,
      _keyFromFields(test8.type, test8.fields, test8.options, test8.config),
      result9,
      _keyFromFields(test9.type, test9.fields, test9.options, test9.config),
    ]),
  ).length === 7,
);
