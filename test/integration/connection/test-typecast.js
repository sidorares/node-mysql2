'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

connection.query(
  {
    sql: 'select "foo uppercase" as foo',
    typeCast: function(field, next) {
      if (field.type == 'VAR_STRING') {
        return field.string().toUpperCase();
      }
      return next();
    }
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'FOO UPPERCASE');
  }
);

connection.query(
  {
    sql: 'select "foobar" as foo',
    typeCast: false
  },
  (err, res) => {
    assert.ifError(err);
    assert(Buffer.isBuffer(res[0].foo));
    assert.equal(res[0].foo.toString('utf8'), 'foobar');
  }
);

connection.query(
  {
    sql: 'SELECT NULL as test, 6 as value;',
    typeCast: function(field, next) {
      return next();
    }
  },
  (err, _rows) => {
    assert.ifError(err);
    assert.equal(_rows[0].test, null);
    assert.equal(_rows[0].value, 6);
  }
);

connection.end();
