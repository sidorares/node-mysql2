var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;

Date = function() {
  var NativeDate = Date;
  function CustomDate(str) {
    return new NativeDate(str);
  }
  return CustomDate;
}();

connection.execute('SELECT UNIX_TIMESTAMP(?) t', [new Date('1990-08-08 UTC')], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  console.log(_rows, _fields);
  connection.end();
});


process.on('exit', function() {
  assert.deepEqual(rows, [{t: 650073600}]);
});
