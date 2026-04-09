import type { Connection } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';
import Command from '../../../lib/commands/command.js';
import ClientConstants from '../../../lib/constants/client.js';
import Packets from '../../../lib/packets/index.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

const serverFlags = 0xffffff & ~ClientConstants.CONNECT_ATTRS;

class ServerHandshakeNoAttrs extends Command {
  serverHello: unknown;

  constructor() {
    super();
  }

  start(_packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const serverHelloPacket = new Packets.Handshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: serverFlags,
    });
    this.serverHello = serverHelloPacket;
    serverHelloPacket.setScrambleData(() => {
      connection.writePacket(serverHelloPacket.toPacket(0));
    });
    return ServerHandshakeNoAttrs.prototype.readClientReply;
  }

  readClientReply(packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const clientReply = Packets.HandshakeResponse.fromPacket(
      packet,
      serverFlags
    );

    strict.equal(clientReply.user, 'test_user');
    strict.equal(clientReply.database, 'test_db');
    strict.equal(
      clientReply.connectAttributes,
      undefined,
      'connectAttributes should be undefined when server does not advertise CONNECT_ATTRS'
    );
    strict.ok(
      clientReply.clientFlags & ClientConstants.CONNECT_ATTRS,
      'raw clientFlags should still contain the CONNECT_ATTRS bit the client sent'
    );

    connection.writeOk();
    return ServerHandshakeNoAttrs.prototype.dispatchCommands;
  }

  dispatchCommands(packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const commandCode = packet.readInt8();
    if (commandCode === 0x03) {
      // COM_QUERY
      connection.writeOk();
    } else {
      connection.end();
    }
    return ServerHandshakeNoAttrs.prototype.dispatchCommands;
  }
}

await describe('Server handshake without CONNECT_ATTRS capability', async () => {
  await it('should mask out CONNECT_ATTRS when parsing client handshake response', async () => {
    let queryOk = false;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('test timed out')),
        5000
      );

      const server = mysql.createServer((conn: Connection) => {
        // @ts-expect-error: TODO: implement typings
        conn.serverConfig = {};
        // @ts-expect-error: TODO: implement typings
        conn.serverConfig.encoding = 'cesu8';
        // @ts-expect-error: TODO: implement typings
        conn.addCommand(new ServerHandshakeNoAttrs());
      });

      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;

        const connection = mysql.createConnection({
          port: port,
          user: 'test_user',
          database: 'test_db',
          password: 'secret',
          connectAttributes: { _client_name: 'test', purpose: 'testing' },
        });

        connection.query('SELECT 1', (err: unknown) => {
          queryOk = err === null;
          connection.end(() => {
            // @ts-expect-error: internal access
            server._server.close(() => {
              clearTimeout(timeout);
              resolve();
            });
          });
        });
      });
    });

    strict.ok(queryOk, 'query after handshake should succeed');
  });
});
