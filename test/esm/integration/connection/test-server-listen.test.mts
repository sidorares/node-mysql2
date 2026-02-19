import type { Server } from '../../../../typings/mysql/lib/Server.js';
import { assert, describe, it } from 'poku';
import mysql from '../../../../index.js';

// Verifies that the Server.listen can be called with any combination of
// pararameters valid for net.Server.listen.

await describe('Server Listen', async () => {
  function testListen(
    listenCaller: (server: Server, callback: () => void) => void
  ) {
    return new Promise<boolean>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      const server = mysql.createServer();
      let listenCallbackFired = false;

      listenCaller(server, () => {
        listenCallbackFired = true;
      });

      setTimeout(() => {
        // @ts-expect-error: internal access
        server._server.close();
        resolve(listenCallbackFired);
      }, 100);
    });
  }

  await it('should listen with port', async () => {
    const fired = await testListen((server, callback) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, callback);
    });
    assert.ok(fired, 'Callback for call with port did not fire');
  });

  await it('should listen with port and host', async () => {
    const fired = await testListen((server, callback) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, '127.0.0.1', callback);
    });
    assert.ok(fired, 'Callback for call with port, host did not fire');
  });

  await it('should listen with port, host, and backlog', async () => {
    const fired = await testListen((server, callback) => {
      // @ts-expect-error: TODO: implement typings
      server.listen(0, '127.0.0.1', 50, callback);
    });

    assert.ok(fired, 'Callback for call with port, host, backlog did not fire');
  });
});
