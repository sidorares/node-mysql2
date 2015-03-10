var assert     = require('assert');
var common     = require('../../common');
var server       = common.createServer(serverReady, function(conn) {
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
    // this is extra (incorrect) packet - client should emit error on receiving it
    conn.writeOk();
  });
});

var fields, error;
var query = 'SELECT 1';
function serverReady() {
  var connection = common.createConnection({ port: 3307 });
  connection.query(query, function(err, _rows, _fields) {
    if (err) throw err;
    rows = _rows;
    fields = _fields;
  });

  connection.on('error', function(err) {
    error = err;
    server.close();
  });
}

process.on('exit', function() {
  assert.deepEqual(rows, [{1: 1}]);
  assert.equal(fields[0].name, '1');
  assert.equal(error.message, 'Unexpected packet while no commands in the queue');
  assert.equal(error.fatal, true);
  assert.equal(error.code, 'PROTOCOL_UNEXPECTED_PACKET');
});
