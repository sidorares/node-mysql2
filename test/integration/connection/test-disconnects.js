var common     = require('../../common');
var assert     = require('assert');

var rows;
var fields;
var err;
var server;

function test() {
  var connection = common.createConnection({port: 3307});
  connection.query('SELECT 123', function(err, _rows, _fields) {
    if (err) throw err;

    rows = _rows;
    fields = _fields;
    connection.on('error', function(_err) {
      err = _err;
    });
    server.connections.forEach(function(conn) { conn.stream.end(); } );
    server._server.close(function() {
      assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
    });
  });
  // TODO: test connection.end() etc where we expect disconnect to happen
}

function serverHandler(conn) {
  conn.on('query', function(q) {
    conn.writeTextResult([ { '1': '1' } ], [ { catalog: 'def',
     schema: '',
     table: '',
     orgTable: '',
     name: '1',
     orgName: '',
     characterSet: 63,
     columnLength: 1,
     columnType: 8,
     flags: 129,
     decimals: 0 } ]);
  });
}
server = common.createServer(test, serverHandler);

process.on('exit', function() {
  assert.deepEqual(rows, [{1: 1}]);
  assert.equal(fields[0].name, '1');
});
