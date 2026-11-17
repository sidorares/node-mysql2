import type { Socket } from 'node:net';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { Duplex } from 'node:stream';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';
import ClientConstants from '../../../lib/constants/client.js';
import Packets from '../../../lib/packets/index.js';
import Packet from '../../../lib/packets/packet.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certs = path.join(__dirname, '../../fixtures/ssl/certs');

// capability flags sent by the ClickHouse server reported in #3988
const clickHouseFlags = 19433992;
const okPacket = Buffer.from([7, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0]);

type Observed = {
  sslRequestFlags?: number;
  handshakeFlags?: number;
  handshakeConnectAttributes?: unknown;
  handshakeHasTrailingData?: boolean;
};

const createPacketReader = (
  onPacket: (packet: Buffer, rest: Buffer) => void
) => {
  let pending = Buffer.alloc(0);
  return (chunk: Buffer) => {
    pending = Buffer.concat([pending, chunk]);
    const headerLength = 4;
    if (pending.length < headerLength) return;
    const packetLength = headerLength + pending.readUIntLE(0, 3);
    if (pending.length < packetLength) return;
    const packet = pending.subarray(0, packetLength);
    const rest = pending.subarray(packetLength);
    pending = Buffer.alloc(0);
    onPacket(packet, rest);
  };
};

const sendServerHello = (socket: Socket) => {
  // @ts-expect-error: TODO: implement typings
  const serverHello = new Packets.Handshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: clickHouseFlags,
  });
  serverHello.setScrambleData(() => {
    const packet = serverHello.toPacket(0);
    packet.writeHeader(0);
    socket.write(packet.buffer);
  });
};

const readHandshakeResponse = (buffer: Buffer, observed: Observed) => {
  const packet = new Packet(0, buffer, 0, buffer.length);
  // @ts-expect-error: TODO: implement typings
  const reply = Packets.HandshakeResponse.fromPacket(packet);
  observed.handshakeFlags = reply.clientFlags;
  observed.handshakeConnectAttributes = reply.connectAttributes;
  observed.handshakeHasTrailingData = packet.haveMoreData();
};

const upgradeToTls = (socket: Socket, bytesAfterSslRequest: Buffer) => {
  const plaintext = new Duplex({
    read() {},
    write(chunk, _encoding, callback) {
      socket.write(chunk, callback);
    },
  });
  socket.removeAllListeners('data');
  socket.on('data', (chunk) => plaintext.push(chunk));
  if (bytesAfterSslRequest.length > 0) plaintext.push(bytesAfterSslRequest);

  return new tls.TLSSocket(plaintext, {
    isServer: true,
    key: fs.readFileSync(path.join(certs, 'server-key.pem')),
    cert: fs.readFileSync(path.join(certs, 'server-cert.pem')),
  });
};

const startFakeTlsServer = async (observed: Observed) => {
  const sockets: Socket[] = [];
  const server = net.createServer((socket) => {
    sockets.push(socket);
    socket.on(
      'data',
      createPacketReader((sslRequest, rest) => {
        observed.sslRequestFlags = sslRequest.readUInt32LE(4);
        const secure = upgradeToTls(socket, rest);
        secure.on(
          'data',
          createPacketReader((handshakeResponse) => {
            readHandshakeResponse(handshakeResponse, observed);
            secure.write(okPacket);
          })
        );
      })
    );
    sendServerHello(socket);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port =
    typeof address === 'object' && address !== null ? address.port : 0;
  const close = () =>
    new Promise<void>((resolve) => {
      for (const socket of sockets) socket.destroy();
      server.close(() => resolve());
    });

  return { port, close };
};

await describe('Client capability flags through the SSL request', async () => {
  const observed: Observed = {};
  const server = await startFakeTlsServer(observed);
  const connection = mysql
    .createConnection({
      host: '127.0.0.1',
      port: server.port,
      user: 'test_user',
      database: 'test_db',
      ssl: { rejectUnauthorized: false },
    })
    .promise();

  await connection.connect();
  connection.destroy();
  await server.close();

  const sentFlags = [observed.sslRequestFlags, observed.handshakeFlags];

  it('should not announce CONNECT_ATTRS in the SSL request or the response', () => {
    for (const flags of sentFlags) {
      strict.equal((flags ?? -1) & ClientConstants.CONNECT_ATTRS, 0);
    }
  });

  it('should send the same flags in the SSL request and the response', () => {
    strict.equal(observed.sslRequestFlags, observed.handshakeFlags);
  });

  it('should not send connection attributes over TLS', () => {
    strict.equal(observed.handshakeConnectAttributes, undefined);
    strict.equal(observed.handshakeHasTrailingData, false);
  });
});
