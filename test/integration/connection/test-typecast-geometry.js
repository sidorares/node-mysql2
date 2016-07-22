var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

connection.query({
  sql: 'select GeomFromText(\'POINT(11 0)\') as foo',
  typeCast: function (field, next) {
    if (field.type === 'GEOMETRY') {
      return field.geometry();
    }
    return next();
  }
}, function(err, res) {
  assert.ifError(err);
  assert.deepEqual(res[0].foo, { x: 11, y: 0 });
});

connection.query({
  sql: 'select GeomFromText(\'POINT(11 0)\') as foo',
  typeCast: function (field, next) {
    if (field.type === 'GEOMETRY') {
      return field.buffer();
    }
    return next();
  }
}, function(err, res) {
  assert.ifError(err);
  assert.equal(Buffer.isBuffer(res[0].foo), true);
});

connection.end();
