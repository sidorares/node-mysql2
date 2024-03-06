'use strict';

const { assert } = require('poku');
const common = require('../../common.test.cjs');

const typeCastWrapper = function (...args) {
  return function (field, next) {
    if (field.type === 'JSON') {
      return JSON.parse(field.string(...args));
    }

    return next();
  };
};

const connection = common.createConnection();
connection.query('CREATE TEMPORARY TABLE t (i JSON)');
connection.query('INSERT INTO t values(\'{ "test": "😀" }\')');

// JSON without encoding options - should result in unexpected behaviors
connection.query(
  {
    sql: 'SELECT * FROM t',
    typeCast: typeCastWrapper(),
  },
  (err, rows) => {
    assert.ifError(err);
    assert.notEqual(rows[0].i.test, '😀');
  },
);

// JSON with encoding explicitly set to utf8
connection.query(
  {
    sql: 'SELECT * FROM t',
    typeCast: typeCastWrapper('utf8'),
  },
  (err, rows) => {
    assert.ifError(err);
    assert.equal(rows[0].i.test, '😀');
  },
);

connection.end();
