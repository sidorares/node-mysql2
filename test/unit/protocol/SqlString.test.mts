import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import { SqlString } from '../../common.test.mjs';

describe('SqlString.escapeId tests', () => {
  it(() => {
    strict.equal(SqlString.escapeId('id'), '`id`', 'value is quoted');
  });

  it(() => {
    strict.equal(
      SqlString.escapeId('i`d'),
      '`i``d`',
      'value containing escapes is quoted'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escapeId('id1.id2'),
      '`id1`.`id2`',
      'value containing separator is quoted'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escapeId('id`1.i`d2'),
      '`id``1`.`i``d2`',
      'value containing separator and escapes is quoted'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escapeId(['a', 'b', 't.c']),
      '`a`, `b`, `t`.`c`',
      'arrays are turned into lists'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escapeId(['a', ['b', ['t.c']]]),
      '`a`, `b`, `t`.`c`',
      'nested arrays are flattened'
    );
  });
});

describe('SqlString.escape tests', () => {
  it(() => {
    strict.equal(SqlString.escape(undefined), 'NULL', 'undefined -> NULL');
  });

  it(() => {
    strict.equal(SqlString.escape(null), 'NULL', 'null -> NULL');
  });

  it(() => {
    strict.equal(
      SqlString.escape(false),
      'false',
      'booleans convert to strings (false)'
    );
    strict.equal(
      SqlString.escape(true),
      'true',
      'booleans convert to strings (true)'
    );
  });

  it(() => {
    strict.equal(SqlString.escape(5), '5', 'numbers convert to strings');
  });

  it(() => {
    strict.equal(
      SqlString.escape({ a: 'b', c: 'd' }),
      "`a` = 'b', `c` = 'd'",
      'objects are turned into key value pairs'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escape({ a: 'b', c: function () {} }),
      "`a` = 'b'",
      'objects function properties are ignored'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escape({ a: { nested: true } }),
      "`a` = '[object Object]'",
      'nested objects are cast to strings'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escape([1, 2, 'c']),
      "1, 2, 'c'",
      'arrays are turned into lists'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escape([
        [1, 2, 3],
        [4, 5, 6],
        ['a', 'b', { nested: true }],
      ]),
      "(1, 2, 3), (4, 5, 6), ('a', 'b', '[object Object]')",
      'nested arrays are turned into grouped lists'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escape([1, { nested: true }, 2]),
      "1, '[object Object]', 2",
      'nested objects inside arrays are cast to strings'
    );
  });

  it(() => {
    strict.equal(SqlString.escape('Super'), "'Super'", 'strings are quoted');
  });

  it(() => {
    strict.equal(SqlString.escape('Sup\0er'), "'Sup\\0er'", '\0 gets escaped');
  });

  it(() => {
    strict.equal(SqlString.escape('Sup\ber'), "'Sup\\ber'", '\b gets escaped');
  });

  it(() => {
    strict.equal(SqlString.escape('Sup\ner'), "'Sup\\ner'", '\n gets escaped');
  });

  it(() => {
    strict.equal(SqlString.escape('Sup\rer'), "'Sup\\rer'", '\r gets escaped');
  });

  it(() => {
    strict.equal(SqlString.escape('Sup\ter'), "'Sup\\ter'", '\t gets escaped');
  });

  it(() => {
    strict.equal(SqlString.escape('Sup\\er'), "'Sup\\\\er'", '\\ gets escaped');
  });

  it(() => {
    strict.equal(
      SqlString.escape('Sup\u001aer'),
      "'Sup\\Zer'",
      '\u001a (ascii 26) gets replaced with \\Z'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escape("Sup'er"),
      "'Sup\\'er'",
      'single quotes get escaped'
    );
  });

  it(() => {
    strict.equal(
      SqlString.escape('Sup"er'),
      "'Sup\\\"er'",
      'double quotes get escaped'
    );
  });

  it(() => {
    const expected = '2012-05-07 11:42:03.002';
    const date = new Date(2012, 4, 7, 11, 42, 3, 2);
    const string: string = SqlString.escape(date);
    strict.strictEqual(
      string,
      `'${expected}'`,
      'dates are converted to YYYY-MM-DD HH:II:SS.sss'
    );
  });

  it(() => {
    const buffer = Buffer.from([0, 1, 254, 255]);
    const string: string = SqlString.escape(buffer);
    strict.strictEqual(string, "X'0001feff'", 'buffers are converted to hex');
  });

  it(() => {
    strict.equal(SqlString.escape(NaN), 'NaN', 'NaN -> NaN');
  });

  it(() => {
    strict.equal(
      SqlString.escape(Infinity),
      'Infinity',
      'Infinity -> Infinity'
    );
  });
});

describe('SqlString.format tests', () => {
  it(() => {
    const sql: string = SqlString.format('? and ?', ['a', 'b']);
    strict.equal(
      sql,
      "'a' and 'b'",
      'question marks are replaced with escaped array values'
    );
  });

  it(() => {
    const sql: string = SqlString.format('? and ?', ['a']);
    strict.equal(sql, "'a' and ?", 'extra question marks are left untouched');
  });

  it(() => {
    const sql: string = SqlString.format('? and ?', ['a', 'b', 'c']);
    strict.equal(sql, "'a' and 'b'", 'extra arguments are not used');
  });

  it(() => {
    const sql: string = SqlString.format('? and ?', ['hello?', 'b']);
    strict.equal(
      sql,
      "'hello?' and 'b'",
      'question marks within values do not cause issues'
    );
  });

  it(() => {
    const sql: string = SqlString.format('?', undefined);
    strict.equal(sql, '?', 'undefined is ignored');
  });

  it(() => {
    const sql: string = SqlString.format('SET ?', { hello: 'world' });
    strict.equal(
      sql,
      "SET `hello` = 'world'",
      'objects is converted to values'
    );
  });

  it(() => {
    const sql: string = SqlString.format('?', { hello: 'world' }, true);
    strict.equal(
      sql,
      "'[object Object]'",
      'objects is not converted to values when flag is true'
    );

    const sql2: string = SqlString.format(
      '?',
      {
        toString: function () {
          return 'hello';
        },
      },
      true
    );
    strict.equal(sql2, "'hello'", 'custom toString function is respected');
  });
});
