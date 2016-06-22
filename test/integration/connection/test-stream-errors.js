var assert = require('assert');
var common = require('../../common');

var clientConnection;
var err = new Error('This socket has been ended by the other party');
err.code = 'EPIPE';

var server = common.createServer(serverReady, function (conn) {
  conn.on('query', function (q) {
    conn.writeColumns([{catalog: 'def',
      schema: '',
      table: '',
      orgTable: '',
      name: '1',
      orgName: '',
      characterSet: 63,
      columnLength: 1,
      columnType: 8,
      flags: 129,
      decimals: 0}]
    );
    // emulate  stream error here
    clientConnection.stream.emit('error', err);
    clientConnection.stream.end();
    server.close();
  });
});

var receivedError1, receivedError2, receivedError3;
var query = 'SELECT 1';
function serverReady () {
  clientConnection = common.createConnection({port: server._port});
  clientConnection.query(query, function (err, _rows, _fields) {
    receivedError1 = err;
  });
  clientConnection.query('second query, should not be executed', function (err, rows) {
    receivedError2 = err;
    clientConnection.query('trying to enqueue command to a connection which is already in error state', function (err1) {
      receivedError3 = err1;
    });
  });
}

process.on('exit', function () {
  assert.equal(receivedError1.fatal, true);
  assert.equal(receivedError1.code, err.code);
  assert.equal(receivedError2.fatal, true);
  assert.equal(receivedError2.code, err.code);
  assert.equal(receivedError3.fatal, true);
  assert.equal(receivedError3.code, err.code);
});
