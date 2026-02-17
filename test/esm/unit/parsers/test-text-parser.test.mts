import type {
  RowDataPacket,
  TypeCastField,
  TypeCastNext,
} from '../../../../index.js';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const typeCastWrapper = function (
  ...args: [encoding?: BufferEncoding | string | undefined]
) {
  return function (field: TypeCastField, next: TypeCastNext) {
    if (field.type === 'JSON') {
      return JSON.parse(field.string(...args) ?? '');
    }

    return next();
  };
};

const connection = createConnection();
connection.query('CREATE TEMPORARY TABLE t (i JSON)');
connection.query('INSERT INTO t values(\'{ "test": "😀" }\')');

// JSON without encoding options - should result in unexpected behaviors
connection.query<RowDataPacket[]>(
  {
    sql: 'SELECT * FROM t',
    typeCast: typeCastWrapper(),
  },
  (err, rows) => {
    assert.ifError(err);
    assert.notEqual(rows[0].i.test, '😀');
  }
);

// JSON with encoding explicitly set to utf8
connection.query<RowDataPacket[]>(
  {
    sql: 'SELECT * FROM t',
    typeCast: typeCastWrapper('utf8'),
  },
  (err, rows) => {
    assert.ifError(err);
    assert.equal(rows[0].i.test, '😀');
  }
);

connection.end();
