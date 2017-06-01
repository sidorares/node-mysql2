var common = require('../../common');
var connection = common.createConnection({multipleStatements: true});
var assert = require('assert');

var _stmt1;
var query1 = '';
var query2 = 'SELECT multi_two(4) AS foo;';

query1 += 'DROP FUNCTION IF EXISTS multi_two;\n';
query1 += 'delimiter $$\n';
query1 += 'CREATE FUNCTION multi_two (x INT) RETURNS INT\n';
query1 += '  DETERMINISTIC\n';
query1 += '  BEGIN\n';
query1 += '    return x * 2;\n';
query1 += '  end\n';
query1 += '$$\n';
query1 += 'delimiter ;\n';

connection.query(query1, function (err) {
  if (err) {
    throw err;
  }

  connection.query(query2, function (err, _rows) {
    if (err) {
      throw err;
    }

    _stmt1 = _rows;
    connection.end();
  });
});

process.on('exit', function () {
  assert(_stmt1 instanceof Array);
  assert.equal(_stmt1[0].foo, 8);
});
