'use strict';

const { assert } = require('poku');
const common = require('../../common.test.cjs');

const connection = common.createConnection({
  typeCast: function (field, next) {
    assert.equal('number', typeof field.length);
    if (field.type === 'VAR_STRING') {
      return field.string().toUpperCase();
    }
    return next();
  },
});

connection.query(
  {
    sql: 'select "foo uppercase" as foo',
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'FOO UPPERCASE');
  },
);

connection.query(
  {
    sql: 'select "foo lowercase" as foo',
    typeCast: function (field, next) {
      assert.equal('number', typeof field.length);
      if (field.type === 'VAR_STRING') {
        return field.string().toLowerCase();
      }
      return next();
    },
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'foo lowercase');
  },
);

connection.end();
