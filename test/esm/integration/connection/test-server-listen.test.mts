import type { Server } from '../../../../typings/mysql/lib/Server.js';
import { assert } from 'poku';
import mysql from '../../../../index.js';

// Verifies that the Server.listen can be called with any combination of
// pararameters valid for net.Server.listen.

function testListen(
  argsDescription: string,
  listenCaller: (server: Server, callback: () => void) => void
) {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();
  let listenCallbackFired = false;

  listenCaller(server, () => {
    listenCallbackFired = true;
  });
  setTimeout(() => {
    assert.ok(
      listenCallbackFired,
      `Callback for call with ${argsDescription} did not fire`
    );
    // @ts-expect-error: internal access
    server._server.close();
  }, 100);
}

testListen('port', (server, callback) => {
  // @ts-expect-error: TODO: implement typings
  server.listen(0, callback);
});

testListen('port, host', (server, callback) => {
  // @ts-expect-error: TODO: implement typings
  server.listen(0, '127.0.0.1', callback);
});

testListen('port, host, backlog', (server, callback) => {
  // @ts-expect-error: TODO: implement typings
  server.listen(0, '127.0.0.1', 50, callback);
});
