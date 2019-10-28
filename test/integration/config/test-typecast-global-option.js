'use strict';

const typeCastWrapper = function(stringMethod) {
  return function(field, next) {
    if (field.type === 'VAR_STRING') {
      return field.string()[stringMethod]();
    }
    return next();
  };
};

const common = require('../../common');
const connection = common.createConnection({
  typeCast: typeCastWrapper('toUpperCase')
});

const assert = require('assert');

// query option override global typeCast
connection.query(
  {
    sql: 'select "FOOBAR" as foo',
    typeCast: typeCastWrapper('toLowerCase')
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'foobar');
  }
);

// global typecast works
connection.query(
  {
    sql: 'select "foobar" as foo'
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(res[0].foo, 'FOOBAR');
  }
);

connection.end();
