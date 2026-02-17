import { describe, it, assert } from 'poku';
import { _keyFromFields } from '../../../../lib/parsers/parser_cache.js';

describe('Cache Key Serialization', () => {
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
        columnType: '\u00a9',
        length: undefined,
        schema: '/',
        table: ',',
        flags: '_',
        characterSet: '\u274c',
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
      bigNumberStrings: [] as any[],
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
      bigNumberStrings: (_: any, next: any) => next(),
      // Expected: "function"
      typeCast: (_: any, next: any) => next(),
      timezone: 'local',
      decimalNumbers: false,
      // Expected: null
      dateStrings: (_: any, next: any) => next(),
    },
    config: {
      supportBigNumbers: undefined,
      bigNumberStrings: undefined,
      timezone: undefined,
    },
  };

  // Similar to test4 but with typeCast: false
  const test10 = {
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
      typeCast: false,
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

  const keyFrom = (t: any): string =>
    _keyFromFields(t.type, t.fields, t.options, t.config);

  it(() => {
    const result1 = keyFrom(test1);
    assert.deepStrictEqual(
      result1,
      '[null,"undefined",null,false,false,false,"undefined",null,false,null,[null,null,null,null,null,null,null]]'
    );
    assert(JSON.parse(result1));
  });

  it(() => {
    const result2 = keyFrom(test2);
    assert.deepStrictEqual(
      result2,
      '[null,"undefined",null,false,false,false,"undefined","local",false,null,[null,null,null,null,null,null,null]]'
    );
    assert(JSON.parse(result2));
  });

  it(() => {
    const result3 = keyFrom(test3);
    assert.deepStrictEqual(
      result3,
      '[null,"string","",false,false,false,true,"local",false,false,[null,null,null,null,null,null,null]]'
    );
    assert(JSON.parse(result3));
  });

  it(() => {
    const result4 = keyFrom(test4);
    assert.deepStrictEqual(
      result4,
      '["binary","boolean",false,false,false,false,true,"local",false,"DATETIME",["id","3",null,"test","test","16899","63"],["value","246",null,"test","test","0","63"]]'
    );
    assert(JSON.parse(result4));
  });

  it(() => {
    const result4 = keyFrom(test4);
    const result5 = keyFrom(test5);
    assert.deepStrictEqual(result4, result5);
    assert(JSON.parse(result5));
  });

  it(() => {
    const result6 = keyFrom(test6);
    assert.deepStrictEqual(
      result6,
      '["binary","boolean",false,true,true,true,true,"\\"\\"`\'",true,"#",[":","©",null,"/",",","_","❌"]]'
    );
    // Ensuring that JSON is valid with invalid delimiters
    assert(JSON.parse(result6));
  });

  it(() => {
    const result7 = keyFrom(test7);
    assert.deepStrictEqual(
      result7,
      '["binary","boolean",true,true,true,true,true,"local",true,"DATETIME",["id","3",null,"test","test","16899","63"],["value","246",null,"test","test","0","63"]]'
    );
    assert(JSON.parse(result7));
  });

  it(() => {
    const result7 = keyFrom(test7);
    const result8 = keyFrom(test8);
    assert.deepStrictEqual(result7, result8);
    assert(JSON.parse(result8));
  });

  it(() => {
    const result9 = keyFrom(test9);
    assert.deepStrictEqual(
      result9,
      '["binary","boolean",false,false,false,true,"function","local",false,null,["id","3",null,"test","test","16899","63"]]'
    );
    assert(JSON.parse(result9));
    assert(JSON.parse(result9)[5] === true);
    assert(JSON.parse(result9)[6] === 'function');
    assert(JSON.parse(result9)[9] === null);
  });

  it(() => {
    const result10 = keyFrom(test10);
    assert.deepStrictEqual(
      result10,
      '["binary","boolean",false,false,false,false,false,"local",false,"DATETIME",["id","3",null,"test","test","16899","63"],["value","246",null,"test","test","0","63"]]'
    );
    assert(JSON.parse(result10));
  });

  // Testing twice all existent tests needs to return 8 keys, since two of them expects to be the same
  it(() => {
    assert(
      Array.from(
        new Set([
          keyFrom(test1),
          keyFrom(test1),
          keyFrom(test2),
          keyFrom(test2),
          keyFrom(test3),
          keyFrom(test3),
          keyFrom(test4),
          keyFrom(test4),
          keyFrom(test5),
          keyFrom(test5),
          keyFrom(test6),
          keyFrom(test6),
          keyFrom(test7),
          keyFrom(test7),
          keyFrom(test8),
          keyFrom(test8),
          keyFrom(test9),
          keyFrom(test9),
          keyFrom(test10),
          keyFrom(test10),
        ])
      ).length === 8
    );
  });

  it(() => {
    const stringify = JSON.stringify;

    // Overwriting the native `JSON.stringify`
    JSON.stringify = (value: any, replacer?: any, space: any = 8) =>
      stringify(value, replacer, space);

    const result1 = keyFrom(test1);

    // Testing twice all existent tests needs to return 8 keys, since two of them expects to be the same
    assert(
      Array.from(
        new Set([
          result1,
          keyFrom(test1),
          keyFrom(test2),
          keyFrom(test2),
          keyFrom(test3),
          keyFrom(test3),
          keyFrom(test4),
          keyFrom(test4),
          keyFrom(test5),
          keyFrom(test5),
          keyFrom(test6),
          keyFrom(test6),
          keyFrom(test7),
          keyFrom(test7),
          keyFrom(test8),
          keyFrom(test8),
          keyFrom(test9),
          keyFrom(test9),
          keyFrom(test10),
          keyFrom(test10),
        ])
      ).length === 8
    );

    JSON.stringify = stringify;
  });
});
