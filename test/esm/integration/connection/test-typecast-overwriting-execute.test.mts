import type { RowDataPacket } from '../../../../index.js';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TypecastRow = RowDataPacket & { foo: string };

const connection = createConnection({
  typeCast: function (field, next) {
    assert.equal('number', typeof field.length);
    if (field.type === 'VAR_STRING') {
      const value = field.string();
      if (value === null) {
        return value;
      }
      return value.toUpperCase();
    }
    return next();
  },
});

connection.execute<TypecastRow[]>(
  {
    sql: 'select "foo uppercase" as foo',
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'FOO UPPERCASE');
  }
);

connection.execute<TypecastRow[]>(
  {
    sql: 'select "foo lowercase" as foo',
    typeCast: function (field, next) {
      assert.equal('number', typeof field.length);
      if (field.type === 'VAR_STRING') {
        const value = field.string();
        if (value === null) {
          return value;
        }
        return value.toLowerCase();
      }
      return next();
    },
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'foo lowercase');
  }
);

connection.end();
