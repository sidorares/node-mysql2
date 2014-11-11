var mysql      = require('../../../index.js');
var auth       = require('../../../lib/auth_41.js');
var assert     = require('assert');

var server;

function authenticate(params, cb) {
  var doubleSha = auth.doubleSha1('testpassword');
  var isValid = auth.verifyToken(params.authPluginData1, params.authPluginData2, params.authToken, doubleSha);
  assert(isValid);
  cb(null);
}

var queryCalls = 0;

var server = mysql.createServer();
server.listen(3307);
server.on('connection', function(conn) {
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff,
    authCallback: authenticate
  });
  conn.on('query', function(sql) {
    assert.equal(sql, 'select 1+1');
    queryCalls++;
    conn.close();
  });
});

var connection = mysql.createConnection({
  port: 3307,
  user: 'testuser',
  database: 'testdatabase',
  passwordSha1: Buffer('8bb6118f8fd6935ad0876a3be34a717d32708ffd', 'hex')
});

connection.on('error', function(err) {
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
});

connection.query('select 1+1', function(err) {
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
  server._server.close();
});

process.on('exit', function() {
  assert.equal(queryCalls, 1);
});
