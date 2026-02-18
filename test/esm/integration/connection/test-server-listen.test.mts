import type { Server } from '../../../../typings/mysql/lib/Server.js';
import { assert, describe, it } from 'poku';
import mysql from '../../../../index.js';

// Verifies that the Server.listen can be called with any combination of
// pararameters valid for net.Server.listen.

await describe('Server Listen', async () => {
  function testListen(
    argsDescription: string,
    listenCaller: (server: Server, callback: () => void) => void
  ) {
    return new Promise<void>((resolve) => {
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
        resolve();
      }, 100);
    });
  }

  await it('should listen with port', async () => {
    await testListen('port', (server, callback) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, callback);
    });
  });

  await it('should listen with port and host', async () => {
    await testListen('port, host', (server, callback) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, '127.0.0.1', callback);
    });
  });

  await it('should listen with port, host, and backlog', async () => {
    await testListen('port, host, backlog', (server, callback) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, '127.0.0.1', 50, callback);
    });
  });
});
