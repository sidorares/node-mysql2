var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

connection.query({
  sql: 'select GeomFromText(\'POINT(11 0)\') as foo',
  typeCast: function (field, next) {
    if (field.type == 'GEOMETRY') {
      return field.geometry();
    }
    return next();
  }
}, function(err, res) {
  assert.ifError(err);
  assert(Buffer.isBuffer(res[0].foo));
});


connection.query({
  sql: 'select GeomFromText(\'POINT(11 0)\') as foo',
  typeCast: false
}, function(err, res) {
  assert.ifError(err);
  assert(Buffer.isBuffer(res[0].foo));
});

connection.end();
