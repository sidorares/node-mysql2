import type {
  RowDataPacket,
  TypeCastField,
  TypeCastNext,
} from '../../../../index.js';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type StringMethod = 'toUpperCase' | 'toLowerCase';

const typeCastWrapper = function (stringMethod: StringMethod) {
  return function (field: TypeCastField, next: TypeCastNext) {
    if (field.type === 'VAR_STRING') {
      const value = field.string();
      return value?.[stringMethod]();
    }
    return next();
  };
};

const connection = createConnection({
  typeCast: typeCastWrapper('toUpperCase'),
});

// query option override global typeCast
connection.query<RowDataPacket[]>(
  {
    sql: 'select "FOOBAR" as foo',
    typeCast: typeCastWrapper('toLowerCase'),
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'foobar');
  }
);

// global typecast works
connection.query<RowDataPacket[]>(
  {
    sql: 'select "foobar" as foo',
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'FOOBAR');
  }
);

connection.end();
