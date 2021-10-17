'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

connection.query('CREATE TEMPORARY TABLE json_test (json_test JSON)');
connection.query('INSERT INTO json_test VALUES (?)', JSON.stringify({ test: 42 }));

connection.query(
  {
    sql: 'select "foo uppercase" as foo',
    typeCast: function(field, next) {
      assert.equal("number", typeof field.length);
      if (field.type === 'VAR_STRING') {

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


connection.query(
  {
    sql: 'SELECT * from json_test',
    typeCast: function(_field, next) {
      return next();
    }
  },
  (err, _rows) => {
    assert.ifError(err);
    assert.equal(_rows[0].json_test.test, 42);
  }
);

connection.execute(
  {
    sql: 'SELECT * from json_test',
    typeCast: function(_field, next) {
      return next();
    }
  },
  (err, _rows) => {
    assert.ifError(err);
    assert.equal(_rows[0].json_test.test, 42);
  }
);

connection.end();
