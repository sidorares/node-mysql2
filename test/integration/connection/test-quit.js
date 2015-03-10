var assert     = require('assert');
var common     = require('../../common');
var quitReceived = false;
var queryCli     = 'SELECT 1';
var server       = common.createServer(serverReady, function(conn) {
  conn.on('quit', function() {
    // COM_QUIT
    quitReceived = true;
    conn.stream.end();
    server.close();
    console.log('quit!!!');
  });

  conn.on('query', function(q) {
    queryServ =  q;
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
});

function serverReady() {
  var connection = common.createConnection({ port: 3307 });

  connection.query(queryCli, function(err, _rows, _fields) {
    if (err) throw err;
    rows = _rows;
    fields = _fields;

    connection.end();
  });
}

process.on('exit', function() {
  assert.deepEqual(rows, [{1: 1}]);
  assert.equal(fields[0].name, '1');
  assert.equal(quitReceived, true);
  assert.equal(queryCli, queryServ);

});
