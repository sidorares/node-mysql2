var common     = require('../../common');
var assert     = require('assert');

var rows = undefined;
var fields = undefined;
var err;
var server; 

function test() {
  var connection = common.createConnection({port: 3307});
  //var connection = require('mysql').createConnection({port: 3307});
  connection.query('SELECT 123', function(err, _rows, _fields) {
    if (err) throw err;

    rows = _rows;
    fields = _fields;
    connection.on('error', function(_err) {
      err = _err;
    });
    server.connections.forEach(function(conn) { conn.stream.end() } );
    server._server.close(function() {
      assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST'); 
    });

    // TODO: tests for 'commands after close' behavior
    //  connection.query('SELECT 123', function(err, a, b) {
    //    console.log(err, a, b);
    //  });
  });

  // TODO: test connection.end() etc where we expect disconnect to happen
}
server = common.createServer(test);

process.on('exit', function() {
  assert.deepEqual(rows, [{1: 1}]);
  assert.equal(fields[0].name, '1');
});
