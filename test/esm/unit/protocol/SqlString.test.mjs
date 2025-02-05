import { assert, test, describe } from 'poku';
import { createRequire } from 'node:module';
import { Buffer } from 'node:buffer';

const require = createRequire(import.meta.url);
const { SqlString, describeOptions } = require('../../../common.test.cjs');

describe('SqlString.escapeId tests', describeOptions);

assert.equal(SqlString.escapeId('id'), '`id`', 'value is quoted');

assert.equal(
  SqlString.escapeId('i`d'),
  '`i``d`',
  'value containing escapes is quoted',
);

assert.equal(
  SqlString.escapeId('id1.id2'),
  '`id1`.`id2`',
  'value containing separator is quoted',
);

assert.equal(
  SqlString.escapeId('id`1.i`d2'),
  '`id``1`.`i``d2`',
  'value containing separator and escapes is quoted',
);

assert.equal(
  SqlString.escapeId(['a', 'b', 't.c']),
  '`a`, `b`, `t`.`c`',
  'arrays are turned into lists',
);

assert.equal(
  SqlString.escapeId(['a', ['b', ['t.c']]]),
  '`a`, `b`, `t`.`c`',
  'nested arrays are flattened',
);

describe('SqlString.escape tests', describeOptions);

assert.equal(SqlString.escape(undefined), 'NULL', 'undefined -> NULL');

assert.equal(SqlString.escape(null), 'NULL', 'null -> NULL');

assert.equal(
  SqlString.escape(false),
  'false',
  'booleans convert to strings (false)',
);
assert.equal(
  SqlString.escape(true),
  'true',
  'booleans convert to strings (true)',
);

assert.equal(SqlString.escape(5), '5', 'numbers convert to strings');

assert.equal(
  SqlString.escape({ a: 'b', c: 'd' }),
  "`a` = 'b', `c` = 'd'",
  'objects are turned into key value pairs',
);

assert.equal(
  SqlString.escape({ a: 'b', c: function () {} }),
  "`a` = 'b'",
  'objects function properties are ignored',
);

assert.equal(
  SqlString.escape({ a: { nested: true } }),
  "`a` = '[object Object]'",
  'nested objects are cast to strings',
);

assert.equal(
  SqlString.escape([1, 2, 'c']),
  "1, 2, 'c'",
  'arrays are turned into lists',
);

assert.equal(
  SqlString.escape([
    [1, 2, 3],
    [4, 5, 6],
    ['a', 'b', { nested: true }],
  ]),
  "(1, 2, 3), (4, 5, 6), ('a', 'b', '[object Object]')",
  'nested arrays are turned into grouped lists',
);

assert.equal(
  SqlString.escape([1, { nested: true }, 2]),
  "1, '[object Object]', 2",
  'nested objects inside arrays are cast to strings',
);

assert.equal(SqlString.escape('Super'), "'Super'", 'strings are quoted');

assert.equal(SqlString.escape('Sup\0er'), "'Sup\\0er'", '\0 gets escaped');

assert.equal(SqlString.escape('Sup\ber'), "'Sup\\ber'", '\b gets escaped');

assert.equal(SqlString.escape('Sup\ner'), "'Sup\\ner'", '\n gets escaped');

assert.equal(SqlString.escape('Sup\rer'), "'Sup\\rer'", '\r gets escaped');

assert.equal(SqlString.escape('Sup\ter'), "'Sup\\ter'", '\t gets escaped');

assert.equal(SqlString.escape('Sup\\er'), "'Sup\\\\er'", '\\ gets escaped');

assert.equal(
  SqlString.escape('Sup\u001aer'),
  "'Sup\\Zer'",
  '\u001a (ascii 26) gets replaced with \\Z',
);

assert.equal(
  SqlString.escape("Sup'er"),
  "'Sup\\'er'",
  'single quotes get escaped',
);

assert.equal(
  SqlString.escape('Sup"er'),
  "'Sup\\\"er'",
  'double quotes get escaped',
);

test(() => {
  const expected = '2012-05-07 11:42:03.002';
  const date = new Date(2012, 4, 7, 11, 42, 3, 2);
  const string = SqlString.escape(date);
  assert.strictEqual(
    string,
    `'${expected}'`,
    'dates are converted to YYYY-MM-DD HH:II:SS.sss',
  );
});

test(() => {
  const buffer = Buffer.from([0, 1, 254, 255]);
  const string = SqlString.escape(buffer);
  assert.strictEqual(string, "X'0001feff'", 'buffers are converted to hex');
});

assert.equal(SqlString.escape(NaN), 'NaN', 'NaN -> NaN');

assert.equal(SqlString.escape(Infinity), 'Infinity', 'Infinity -> Infinity');

describe('SqlString.format tests', describeOptions);

test(() => {
  const sql = SqlString.format('? and ?', ['a', 'b']);
  assert.equal(
    sql,
    "'a' and 'b'",
    'question marks are replaced with escaped array values',
  );
});

test(() => {
  const sql = SqlString.format('? and ?', ['a']);
  assert.equal(sql, "'a' and ?", 'extra question marks are left untouched');
});

test(() => {
  const sql = SqlString.format('? and ?', ['a', 'b', 'c']);
  assert.equal(sql, "'a' and 'b'", 'extra arguments are not used');
});

test(() => {
  const sql = SqlString.format('? and ?', ['hello?', 'b']);
  assert.equal(
    sql,
    "'hello?' and 'b'",
    'question marks within values do not cause issues',
  );
});

test(() => {
  const sql = SqlString.format('?', undefined);
  assert.equal(sql, '?', 'undefined is ignored');
});

test(() => {
  const sql = SqlString.format('?', { hello: 'world' });
  assert.equal(sql, "`hello` = 'world'", 'objects is converted to values');
});

test(() => {
  const sql = SqlString.format('?', { hello: 'world' }, true);
  assert.equal(
    sql,
    "'[object Object]'",
    'objects is not converted to values when flag is true',
  );

  const sql2 = SqlString.format(
    '?',
    {
      toString: function () {
        return 'hello';
      },
    },
    true,
  );
  assert.equal(sql2, "'hello'", 'custom toString function is respected');
});
