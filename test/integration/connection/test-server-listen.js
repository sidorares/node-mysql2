var assert = require('assert');
var mysql = require('../../../index.js')

// Verifies that the Server.listen can be called with any combination of
// pararameters valid for net.Server.listen.

var server = mysql.createServer();
var serverListenCallbackFired = false;

function testListen(argsDescription, listenCaller) {
  var server = mysql.createServer();
  var listenCallbackFired = false;

  listenCaller(server, function() {
    listenCallbackFired = true;
  });
  setTimeout(function() {
    assert.ok(
      listenCallbackFired,
      'Callback for call with ' + argsDescription + ' did not fire');
    server._server.close();
  }, 100);
}

testListen('port', function(server, callback) {
  server.listen(0, callback);
});

testListen('port, host', function(server, callback) {
  server.listen(0, '127.0.0.1', callback);
});

testListen('port, host, backlog', function(server, callback) {
  server.listen(0, '127.0.0.1', 50, callback);
});
