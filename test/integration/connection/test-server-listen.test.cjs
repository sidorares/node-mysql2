'use strict';

const { assert } = require('poku');
const mysql = require('../../../index.js');

// Verifies that the Server.listen can be called with any combination of
// pararameters valid for net.Server.listen.

function testListen(argsDescription, listenCaller) {
  const server = mysql.createServer();
  let listenCallbackFired = false;

  listenCaller(server, () => {
    listenCallbackFired = true;
  });
  setTimeout(() => {
    assert.ok(
      listenCallbackFired,
      `Callback for call with ${argsDescription} did not fire`,
    );
    server._server.close();
  }, 100);
}

testListen('port', (server, callback) => {
  server.listen(0, callback);
});

testListen('port, host', (server, callback) => {
  server.listen(0, '127.0.0.1', callback);
});

testListen('port, host, backlog', (server, callback) => {
  server.listen(0, '127.0.0.1', 50, callback);
});
