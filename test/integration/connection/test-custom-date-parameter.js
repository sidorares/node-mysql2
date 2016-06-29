var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var rows = undefined;

Date = function () {
  var NativeDate = Date;
  function CustomDate (str) {
    return new NativeDate(str);
  }
  CustomDate.now = Date.now;
  return CustomDate;
}();

connection.query("set time_zone = '+00:00'");
connection.execute('SELECT UNIX_TIMESTAMP(?) t', [new Date('1990-08-08 UTC')], function (err, _rows, _fields) {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});


process.on('exit', function () {
  assert.equal(rows[0].t, 650073600);
});
