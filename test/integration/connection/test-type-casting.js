var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

common.useTestDb(connection);

var tests = require('./type-casting-tests')(connection);

var table = 'type_casting';

var schema  = [];
var inserts = [];

tests.forEach(function(test, index) {
  var escaped = test.insertRaw || connection.escape(test.insert);

  test.columnName = test.type + '_' + index;

  schema.push('`' + test.columnName + '` ' + test.type + ',');
  inserts.push('`' + test.columnName + '` = ' + escaped);
});

var createTable = [
  'CREATE TEMPORARY TABLE `' + table + '` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,'
  ].concat(schema).concat([
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
]).join('\n');

connection.query(createTable);

connection.query('INSERT INTO ' + table + ' SET' + inserts.join(',\n'));

var row;
connection.query('SELECT * FROM type_casting', function(err, rows) {
  if (err) throw err;

  row = rows[0];
  connection.end();
});


process.on('exit', function() {
  tests.forEach(function(test) {
    var expected = test.expect || test.insert;
    var got      = row[test.columnName];
    var message;

    if (expected instanceof Date) {
      assert.equal(got instanceof Date, true, test.type);

      expected = String(expected);
      got      = String(got);
    } else if (Buffer.isBuffer(expected)) {
      assert.equal(Buffer.isBuffer(got), true, test.type);

      expected = String(Array.prototype.slice.call(expected));
      got      = String(Array.prototype.slice.call(got));
    }

    if (test.deep) {
      message = 'got: "' + JSON.stringify(got) + '" expected: "' + JSON.stringify(expected) +
                '" test: ' + test.type + '';
      assert.deepEqual(expected, got, message);
    } else {
      message = 'got: "' + got + '" (' + (typeof got) + ') expected: "' + expected +
                '" (' + (typeof expected) + ') test: ' + test.type + '';
      assert.strictEqual(expected, got, message);
    }
  });
});
