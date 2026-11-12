import type { Connection } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';
import Command from '../../../lib/commands/command.js';
import ClientConstants from '../../../lib/constants/client.js';
import CommandCode from '../../../lib/constants/commands.js';
import Packets from '../../../lib/packets/index.js';
import Packet from '../../../lib/packets/packet.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

// capability flags sent by the ClickHouse server reported in #3988
const clickHouseFlags = 19433992;
const noConnectAttrsFlags = 0xffffff & ~ClientConstants.CONNECT_ATTRS;

type Observed = {
  handshakeFlags?: number;
  changeUserHasTrailingData?: boolean;
};

class FakeServer extends Command {
  serverFlags: number;
  observed: Observed;

  constructor(serverFlags: number, observed: Observed) {
    super();
    this.serverFlags = serverFlags;
    this.observed = observed;
  }

  start(_packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const serverHello = new Packets.Handshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: this.serverFlags,
    });
    serverHello.setScrambleData(() => {
      connection.writePacket(serverHello.toPacket(0));
    });
    return FakeServer.prototype.readHandshakeResponse;
  }

  readHandshakeResponse(packet: unknown, connection: Connection) {
    // @ts-expect-error: TODO: implement typings
    const reply = Packets.HandshakeResponse.fromPacket(
      packet,
      this.serverFlags
    );
    this.observed.handshakeFlags = reply.clientFlags;
    connection.writeOk();
    return FakeServer.prototype.dispatchCommands;
  }

  // COM_CHANGE_USER layout for a client using SECURE_CONNECTION and PLUGIN_AUTH:
  // command, user, auth token, database, charset, auth plugin name, then
  // connection attributes only when CONNECT_ATTRS was negotiated
  readChangeUser(packet: typeof Packet.prototype, connection: Connection) {
    packet.readNullTerminatedString('utf8');
    packet.readBuffer(packet.readInt8());
    packet.readNullTerminatedString('utf8');
    packet.readInt16();
    packet.readNullTerminatedString('latin1');
    this.observed.changeUserHasTrailingData = packet.haveMoreData();
    connection.writeOk();
  }

  dispatchCommands(packet: typeof Packet.prototype, connection: Connection) {
    const commandCode = packet.readInt8();
    if (commandCode === CommandCode.CHANGE_USER) {
      this.readChangeUser(packet, connection);
    } else if (commandCode === CommandCode.QUERY) {
      connection.writeOk();
    } else {
      connection.end();
    }
    return FakeServer.prototype.dispatchCommands;
  }
}

const startFakeServer = async (serverFlags: number, observed: Observed) => {
  const server = mysql.createServer((conn: Connection) => {
    // @ts-expect-error: TODO: implement typings
    conn.serverConfig = { encoding: 'cesu8' };
    // @ts-expect-error: TODO: implement typings
    conn.addCommand(new FakeServer(serverFlags, observed));
  });

  await new Promise<void>((resolve) => {
    // @ts-expect-error: TODO: implement typings
    server.listen(0, resolve);
  });

  // @ts-expect-error: internal access
  const port: number = server._server.address().port;
  const close = () =>
    new Promise<void>((resolve) => {
      // @ts-expect-error: internal access
      server._server.close(() => resolve());
    });

  return { port, close };
};

await describe('Client capability flags against a ClickHouse server', async () => {
  const observed: Observed = {};
  const server = await startFakeServer(clickHouseFlags, observed);
  const connection = mysql
    .createConnection({
      port: server.port,
      user: 'test_user',
      database: 'test_db',
    })
    .promise();

  await connection.query('SELECT 1');
  await connection.end();
  await server.close();

  it('should only announce flags the server advertises', () => {
    strict.equal(
      (observed.handshakeFlags ?? -1) & ~clickHouseFlags,
      0,
      'handshake response contains flags the server did not advertise'
    );
  });

  it('should not announce SESSION_TRACK', () => {
    strict.equal(
      (observed.handshakeFlags ?? -1) & ClientConstants.SESSION_TRACK,
      0
    );
  });
});

await describe('changeUser() against a server without CONNECT_ATTRS', async () => {
  const observed: Observed = {};
  const server = await startFakeServer(noConnectAttrsFlags, observed);
  const connection = mysql
    .createConnection({
      port: server.port,
      user: 'test_user',
      database: 'test_db',
    })
    .promise();

  await connection.changeUser({ user: 'changed_user' });
  await connection.end();
  await server.close();

  it('should not send connection attributes in COM_CHANGE_USER', () => {
    strict.equal(observed.changeUserHasTrailingData, false);
  });
});
