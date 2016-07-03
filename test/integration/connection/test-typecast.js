var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

connection.query({
  sql: 'select "foo uppercase" as foo',
  typeCast: function (field, next) {
    if (field.type == 'VAR_STRING') {
      return field.string().toUpperCase();
    }
    return next();
  }
}, function(err, res) {
  assert.ifError(err);
  assert.equal(res[0].foo, 'FOO UPPERCASE')
});


connection.query({
  sql: 'select "foobar" as foo',
  typeCast: false
}, function(err, res) {
  assert.ifError(err);
  assert(Buffer.isBuffer(res[0].foo));
  assert.equal(res[0].foo.toString('utf8'), 'foobar');
});

connection.end();
