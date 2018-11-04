'use strict';

const assert = require('assert');
const mysql = require('../../../index.js');

// Verifies that the Server.listen can be called with any combination of
// pararameters valid for net.Server.listen.

function testListen(argsDescription, listenCaller) {
  const server = mysql.createServer();
  let listenCallbackFired = false;

  listenCaller(server, function() {
    listenCallbackFired = true;
  });
  setTimeout(function() {
    assert.ok(
      listenCallbackFired,
      'Callback for call with ' + argsDescription + ' did not fire'
    );
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
