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
const serverRequestFlags =
  ClientConstants.FOUND_ROWS |
  ClientConstants.IGNORE_SPACE |
  ClientConstants.INTERACTIVE |
  ClientConstants.LOCAL_FILES |
  ClientConstants.MULTI_STATEMENTS |
  ClientConstants.MULTI_RESULTS |
  ClientConstants.PS_MULTI_RESULTS;

type ChangeUser = {
  user: string;
  database: string;
  authPluginName: string;
  hasTrailingData: boolean;
};

type Observed = {
  handshakeFlags?: number;
  changeUser?: ChangeUser;
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

  readChangeUser(packet: typeof Packet.prototype, connection: Connection) {
    const user = packet.readNullTerminatedString('utf8');
    const authTokenLength = packet.readInt8();
    packet.skip(authTokenLength);
    const database = packet.readNullTerminatedString('utf8');
    const charsetNumberLength = 2;
    packet.skip(charsetNumberLength);
    const authPluginName = packet.readNullTerminatedString('latin1');
    this.observed.changeUser = {
      user,
      database,
      authPluginName,
      hasTrailingData: packet.haveMoreData(),
    };
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

const connectAndQuery = async (
  serverFlags: number,
  options: { multipleStatements?: boolean } = {}
) => {
  const observed: Observed = {};
  const server = await startFakeServer(serverFlags, observed);
  const connection = mysql
    .createConnection({
      port: server.port,
      user: 'test_user',
      database: 'test_db',
      ...options,
    })
    .promise();

  await connection.query('SELECT 1');
  await connection.end();
  await server.close();

  return observed.handshakeFlags ?? -1;
};

await describe('Client capability flags against a ClickHouse server', async () => {
  const handshakeFlags = await connectAndQuery(clickHouseFlags, {
    multipleStatements: true,
  });

  it('should only announce layout flags the server advertises', () => {
    strict.equal(
      handshakeFlags &
        ~(clickHouseFlags | ClientConstants.PROTOCOL_41 | serverRequestFlags),
      0
    );
  });

  it('should not announce CONNECT_ATTRS or SESSION_TRACK', () => {
    strict.equal(handshakeFlags & ClientConstants.CONNECT_ATTRS, 0);
    strict.equal(handshakeFlags & ClientConstants.SESSION_TRACK, 0);
  });

  it('should keep request flags the server does not advertise', () => {
    strict.equal(clickHouseFlags & ClientConstants.IGNORE_SPACE, 0);
    strict.equal(clickHouseFlags & ClientConstants.MULTI_STATEMENTS, 0);
    strict.notEqual(handshakeFlags & ClientConstants.IGNORE_SPACE, 0);
    strict.notEqual(handshakeFlags & ClientConstants.MULTI_STATEMENTS, 0);
  });
});

await describe('Client capability flags against a server without PROTOCOL_41', async () => {
  const handshakeFlags = await connectAndQuery(
    clickHouseFlags & ~ClientConstants.PROTOCOL_41
  );

  it('should keep PROTOCOL_41 since only the 4.1 layout is written', () => {
    strict.notEqual(handshakeFlags & ClientConstants.PROTOCOL_41, 0);
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
    strict.equal(observed.changeUser?.user, 'changed_user');
    strict.equal(observed.changeUser?.database, 'test_db');
    strict.equal(observed.changeUser?.authPluginName, 'mysql_native_password');
    strict.equal(observed.changeUser?.hasTrailingData, false);
  });
});
