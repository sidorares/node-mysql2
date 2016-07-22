var typeCastWrapper = function (stringMethod) {
  return function (field, next) {
    if (field.type == 'VAR_STRING') {
      return field.string()[stringMethod]();
    }
    return next();
  };
};

var common = require('../../common');
var connection = common.createConnection({
  typeCast: typeCastWrapper('toUpperCase')
});

var assert = require('assert');

// query option override global typeCast
connection.query({
  sql: 'select "FOOBAR" as foo',
  typeCast: typeCastWrapper('toLowerCase')
}, function(err, res) {
  assert.ifError(err);
  assert.equal(res[0].foo, 'foobar')
});

// global typecast works
connection.query({
  sql: 'select "foobar" as foo',
}, function(err, res) {
  assert.ifError(err);
  assert.equal(res[0].foo, 'FOOBAR');
});

connection.end();
