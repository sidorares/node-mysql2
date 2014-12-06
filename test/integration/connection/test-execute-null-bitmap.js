var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var params = [1, 2];
var query = 'select ? + ?';

function dotest() {
  connection.execute(query + ' as t', params, function(err, _rows, _fields) {
    assert.equal(err, null);
    if (params.length < 50) {
      assert.equal(_rows[0].t, params.reduce(function(x,y) {return x+y;}));
      query += ' + ?';
      params.push(params.length);
      dotest();
    } else {
      connection.end();
    }
  });
}

connection.query('SET GLOBAL max_prepared_stmt_count=300', dotest);
