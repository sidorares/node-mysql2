import type { Connection } from '../../index.js';
import { Buffer } from 'node:buffer';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../index.js';
import Command from '../../lib/commands/command.js';
import Packets from '../../lib/packets/index.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

class CleartextAuthSwitchHandshake extends Command {
  receivedPassword: string | null = null;

  start(_packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const serverHelloPacket = new Packets.Handshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff,
    });
    serverHelloPacket.setScrambleData(() => {
      connection.writePacket(serverHelloPacket.toPacket(0));
    });
    return CleartextAuthSwitchHandshake.prototype.readClientReply;
  }

  readClientReply(packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    Packets.HandshakeResponse.fromPacket(packet);
    // @ts-expect-error: TODO: implement typings
    const asr = new Packets.AuthSwitchRequest({
      pluginName: 'mysql_clear_password',
      pluginData: Buffer.alloc(0),
    });
    connection.writePacket(asr.toPacket());
    return CleartextAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
  }

  readClientAuthSwitchResponse(packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const response = Packets.AuthSwitchResponse.fromPacket(packet);
    this.receivedPassword = response.data.toString('utf8').replace(/\0$/, '');
    connection.writeOk();
    return CleartextAuthSwitchHandshake.prototype.dispatchCommands;
  }

  dispatchCommands(_packet: unknown, connection: Connection) {
    connection.end();
    return null;
  }
}

function createMockServer(): Promise<{
  server: ReturnType<typeof mysql.createServer>;
  port: number;
  lastHandshake: () => CleartextAuthSwitchHandshake;
}> {
  let lastCmd: CleartextAuthSwitchHandshake;

  return new Promise((resolve) => {
    const server = mysql.createServer((conn: Connection) => {
      // @ts-expect-error: TODO: implement typings
      conn.serverConfig = {};
      // @ts-expect-error: TODO: implement typings
      conn.serverConfig.encoding = 'cesu8';
      conn.on('error', () => {});
      lastCmd = new CleartextAuthSwitchHandshake();
      // @ts-expect-error: TODO: implement typings
      conn.addCommand(lastCmd);
    });

    // @ts-expect-error: TODO: implement typings
    server.listen(0, () => {
      // @ts-expect-error: internal access
      const port = server._server.address().port;
      resolve({ server, port, lastHandshake: () => lastCmd });
    });
  });
}

await describe('Cleartext plugin gate', async () => {
  await it('should reject cleartext auth by default', async () => {
    const { server, port } = await createMockServer();

    await new Promise<void>((resolve) => {
      const conn = mysql.createConnection({
        user: 'test_user',
        password: 'test_password',
        database: 'test_database',
        port: port,
        host: 'localhost',
      });

      conn.on('error', (err: Error & { code?: string }) => {
        strict.equal(
          err.code,
          'MYSQL_CLEAR_PASSWORD_NOT_ENABLED',
          'Should emit MYSQL_CLEAR_PASSWORD_NOT_ENABLED error'
        );
        strict.ok(
          err.message.includes('enableCleartextPlugin'),
          'Error message should mention the enableCleartextPlugin option'
        );
        conn.destroy();
        server.close(() => resolve());
      });
    });
  });

  await it('should allow cleartext auth with enableCleartextPlugin: true', async () => {
    const { server, port, lastHandshake } = await createMockServer();

    await new Promise<void>((resolve) => {
      const conn = mysql.createConnection({
        user: 'test_user',
        password: 'test_password',
        database: 'test_database',
        port: port,
        host: 'localhost',
        enableCleartextPlugin: true,
      });

      conn.on('error', () => {});

      conn.on('connect', () => {
        strict.equal(
          lastHandshake().receivedPassword,
          'test_password',
          'Server should receive the cleartext password'
        );

        conn.end(() => {
          server.close(() => resolve());
        });
      });
    });
  });

  await it('should allow cleartext auth with custom authPlugins entry (implicit opt-in)', async () => {
    const { server, port, lastHandshake } = await createMockServer();

    await new Promise<void>((resolve) => {
      const conn = mysql.createConnection({
        user: 'test_user',
        password: 'custom_password',
        database: 'test_database',
        port: port,
        host: 'localhost',
        authPlugins: {
          mysql_clear_password: () => () => Buffer.from('custom_password\0'),
        },
      });

      conn.on('error', () => {});

      conn.on('connect', () => {
        strict.equal(
          lastHandshake().receivedPassword,
          'custom_password',
          'Server should receive the password from the custom plugin'
        );

        conn.end(() => {
          server.close(() => resolve());
        });
      });
    });
  });
});
