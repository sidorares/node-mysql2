import type { AddressInfo, Socket } from 'node:net';
import type {
  Connection,
  ConnectionOptions,
  ResultSetHeader,
} from '../../../index.js';
import { Buffer } from 'node:buffer';
import net from 'node:net';
import { Readable } from 'node:stream';
import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import ClientConstants from '../../../lib/constants/client.js';
import ServerStatus from '../../../lib/constants/server_status.js';

const COM_QUERY = 0x03;
const COM_QUIT = 0x01;

const SERVER_CAPABILITIES =
  ClientConstants.LONG_PASSWORD |
  ClientConstants.FOUND_ROWS |
  ClientConstants.LONG_FLAG |
  ClientConstants.CONNECT_WITH_DB |
  ClientConstants.LOCAL_FILES |
  ClientConstants.PROTOCOL_41 |
  ClientConstants.TRANSACTIONS |
  ClientConstants.SECURE_CONNECTION |
  ClientConstants.MULTI_STATEMENTS |
  ClientConstants.MULTI_RESULTS |
  ClientConstants.PS_MULTI_RESULTS |
  ClientConstants.PLUGIN_AUTH;

type ReceivedPacket = { sequenceId: number; type: number; text: string };

const frame = (sequenceId: number, payload: Buffer) => {
  const packet = Buffer.alloc(4 + payload.length);
  packet.writeUIntLE(payload.length, 0, 3);
  packet[3] = sequenceId;
  payload.copy(packet, 4);
  return packet;
};

const handshake = () => {
  const capabilities = Buffer.alloc(4);
  capabilities.writeUInt32LE(SERVER_CAPABILITIES);
  return frame(
    0,
    Buffer.concat([
      Buffer.from([10]),
      Buffer.from('8.0.0-scripted\0'),
      Buffer.from([1, 0, 0, 0]),
      Buffer.from('abcdefgh\0'),
      capabilities.subarray(0, 2),
      Buffer.from([45]),
      Buffer.from([ServerStatus.SERVER_STATUS_AUTOCOMMIT, 0]),
      capabilities.subarray(2, 4),
      Buffer.from([21]),
      Buffer.alloc(10),
      Buffer.from('ijklmnopqrst\0'),
      Buffer.from('mysql_native_password\0'),
    ])
  );
};

const okPayload = (
  affectedRows: number,
  status: number = ServerStatus.SERVER_STATUS_AUTOCOMMIT
) => Buffer.from([0, affectedRows, 0, status & 0xff, status >> 8, 0, 0]);

const startScriptedServer = async () => {
  const received: ReceivedPacket[] = [];
  const waiters: { count: number; resolve: () => void }[] = [];
  const state = { clientFlags: 0, socket: null as Socket | null };

  const server = net.createServer((socket) => {
    state.socket = socket;
    let buffered = Buffer.alloc(0);
    let authenticated = false;
    socket.on('error', () => {});
    socket.write(handshake());
    socket.on('data', (chunk: Buffer) => {
      buffered = Buffer.concat([buffered, chunk]);
      while (buffered.length >= 4) {
        const length = buffered.readUIntLE(0, 3);
        if (buffered.length < 4 + length) {
          break;
        }
        const sequenceId = buffered[3];
        const payload = buffered.subarray(4, 4 + length);
        buffered = buffered.subarray(4 + length);
        if (!authenticated) {
          authenticated = true;
          state.clientFlags = payload.readUInt32LE(0);
          socket.write(frame(2, okPayload(0)));
          continue;
        }
        if (payload[0] === COM_QUIT) {
          socket.destroy();
          return;
        }
        if (sequenceId > 0 && length === 0) {
          socket.write(frame(sequenceId + 1, okPayload(0)));
        }
        received.push({
          sequenceId,
          type: payload[0],
          text: payload.subarray(1).toString('latin1'),
        });
        for (const waiter of waiters.splice(0)) {
          if (received.length >= waiter.count) {
            waiter.resolve();
          } else {
            waiters.push(waiter);
          }
        }
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  return {
    port: (server.address() as AddressInfo).port,
    received,
    state,
    waitForPackets: (count: number) =>
      received.length >= count
        ? Promise.resolve()
        : new Promise<void>((resolve) => waiters.push({ count, resolve })),
    reply: (sequenceId: number, payload: Buffer) => {
      state.socket?.write(frame(sequenceId, payload));
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
};

const connectTo = async (port: number, options: ConnectionOptions = {}) => {
  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'scripted',
    password: 'scripted',
    pipelining: 32,
    ...options,
  });
  connection.on('error', () => {});
  await new Promise<void>((resolve) =>
    connection.once('connect', () => resolve())
  );
  return connection;
};

const writtenAhead = (connection: Connection) => {
  const written: string[] = [];
  // @ts-expect-error: internal access
  const queue = connection._commands;
  for (let i = 0; i < queue.length; i++) {
    const command = queue.get(i);
    if (command._pipelinedSequenceId !== undefined) {
      written.push(command.sql);
    }
  }
  return written;
};

const affectedRows = (result: unknown) =>
  (result as ResultSetHeader).affectedRows;

await describe('Pipelining: writes queued commands before earlier replies', async () => {
  const server = await startScriptedServer();
  const connection = await connectTo(server.port, { pipelining: 4 });
  const db = connection.promise();
  const warnings: string[] = [];
  connection.on('warn', (warning: Error) => warnings.push(warning.message));

  const results = Array.from({ length: 6 }, (_, i) => db.query(`SELECT ${i}`));

  it('writes up to the depth without waiting', () => {
    strict.deepEqual(writtenAhead(connection), [
      'SELECT 1',
      'SELECT 2',
      'SELECT 3',
    ]);
  });

  await it('sends them in order with a fresh sequence id each', async () => {
    await server.waitForPackets(4);

    strict.deepEqual(
      server.received.map((packet) => [packet.sequenceId, packet.text]),
      [
        [0, 'SELECT 0'],
        [0, 'SELECT 1'],
        [0, 'SELECT 2'],
        [0, 'SELECT 3'],
      ]
    );
  });

  await it('writes one more command per completed one', async () => {
    server.reply(1, okPayload(0));
    await results[0];

    strict.deepEqual(writtenAhead(connection), [
      'SELECT 2',
      'SELECT 3',
      'SELECT 4',
    ]);
  });

  await it('delivers each reply to its own caller, in order', async () => {
    for (let i = 1; i < 6; i++) {
      await server.waitForPackets(Math.min(i + 4, 6));
      server.reply(1, okPayload(i));
    }
    const settled = await Promise.all(results);

    strict.deepEqual(
      settled.map(([result]) => affectedRows(result)),
      [0, 1, 2, 3, 4, 5]
    );
    strict.deepEqual(warnings, []);
  });

  connection.destroy();
  await server.close();
});

await describe('Pipelining: session-changing statements are barriers', async () => {
  const server = await startScriptedServer();
  const connection = await connectTo(server.port);
  const db = connection.promise();

  const first = db.query('SELECT 1');
  const setNames = db.query('SET NAMES latin1');
  const after = db.query('SELECT 2');

  it('writes no SET behind a command in flight', () => {
    strict.deepEqual(writtenAhead(connection), []);
  });

  await it('writes nothing behind a SET until it completes', async () => {
    await server.waitForPackets(1);
    server.reply(1, okPayload(1));
    await first;

    strict.deepEqual(writtenAhead(connection), []);
  });

  await it('resumes once the SET has completed', async () => {
    await server.waitForPackets(2);
    server.reply(1, okPayload(2));
    await setNames;
    await server.waitForPackets(3);
    server.reply(1, okPayload(3));
    await after;

    strict.deepEqual(
      server.received.map((packet) => packet.text),
      ['SELECT 1', 'SET NAMES latin1', 'SELECT 2']
    );
  });

  connection.destroy();
  await server.close();
});

await describe('Pipelining: text that depends on session state is a barrier', async () => {
  const server = await startScriptedServer();
  const connection = await connectTo(server.port);
  const db = connection.promise();

  for (const [kind, value, expected] of [
    ['an ASCII value', 'plain', ["SELECT 'plain' AS v", 'SELECT 3']],
    ['a non-ASCII value', 'é', []],
    ['a value escaped differently per sql_mode', "it's", []],
  ] as [string, string, string[]][]) {
    await it(`pipelines a query with ${kind} only when it is safe`, async () => {
      const queries = [
        db.query('SELECT 1'),
        db.query('SELECT ? AS v', [value]),
        db.query('SELECT 3'),
      ];

      strict.deepEqual(writtenAhead(connection), expected);

      const start = server.received.length;
      for (let i = 1; i <= 3; i++) {
        await server.waitForPackets(start + i);
        server.reply(1, okPayload(i));
        await queries[i - 1];
      }
    });
  }

  connection.destroy();
  await server.close();
});

await describe('Pipelining: nothing is pipelined inside a transaction', async () => {
  const server = await startScriptedServer();
  const connection = await connectTo(server.port);
  const db = connection.promise();
  const inTransaction =
    ServerStatus.SERVER_STATUS_AUTOCOMMIT | ServerStatus.SERVER_STATUS_IN_TRANS;

  const opening = db.query('SELECT 1');
  await server.waitForPackets(1);
  server.reply(1, okPayload(1, inTransaction));
  await opening;

  const queries = [db.query('SELECT 2'), db.query('SELECT 3')];

  await it('waits for each reply while the server reports an open transaction', async () => {
    strict.deepEqual(writtenAhead(connection), []);

    await server.waitForPackets(2);
    server.reply(1, okPayload(2, inTransaction));
    await queries[0];
    await server.waitForPackets(3);
    server.reply(1, okPayload(3));
    await queries[1];
  });

  connection.destroy();
  await server.close();
});

await describe('Pipelining: replies numbered across commands are accepted', async () => {
  const server = await startScriptedServer();
  const connection = await connectTo(server.port);
  const db = connection.promise();
  const warnings: string[] = [];
  connection.on('warn', (warning: Error) => warnings.push(warning.message));

  const queries = [1, 2, 3].map((i) => db.query(`SELECT ${i}`));

  await it('adopts the first sequence id of each pipelined reply', async () => {
    await server.waitForPackets(3);
    for (const i of [1, 2, 3]) {
      server.reply(i, okPayload(i));
    }
    const settled = await Promise.all(queries);

    strict.deepEqual(
      settled.map(([result]) => affectedRows(result)),
      [1, 2, 3]
    );
    strict.deepEqual(warnings, []);
  });

  connection.destroy();
  await server.close();
});

await describe('Pipelining: a query timeout starts when the command becomes current', async () => {
  const server = await startScriptedServer();
  const connection = await connectTo(server.port);

  const headDone = new Promise<void>((resolve) =>
    connection.query('SELECT 1', () => resolve())
  );
  let timedDone: () => void = () => {};
  const timedSettled = new Promise<void>((resolve) => {
    timedDone = resolve;
  });
  const timed = connection.query({ sql: 'SELECT 2', timeout: 60_000 }, () =>
    timedDone()
  );

  it('holds no timer while the command waits behind another', () => {
    strict.deepEqual(writtenAhead(connection), ['SELECT 2']);
    // @ts-expect-error: internal access
    strict.equal(timed.queryTimeout, null);
  });

  await it('arms the timer once the command is current', async () => {
    await server.waitForPackets(2);
    server.reply(1, okPayload(1));
    await headDone;

    // @ts-expect-error: internal access
    strict.notEqual(timed.queryTimeout, null);
  });

  server.reply(1, okPayload(2));
  await timedSettled;
  connection.destroy();
  await server.close();
});

const infileModes: [string, ConnectionOptions][] = [
  ['pipelining on', {}],
  [
    'pipelining off, LOCAL_FILES disabled',
    { pipelining: false, flags: ['-LOCAL_FILES'] },
  ],
];

for (const [mode, options] of infileModes) {
  await describe(`LOCAL INFILE request without LOCAL_FILES negotiated (${mode})`, async () => {
    const server = await startScriptedServer();
    let factoryCalls = 0;
    const connection = await connectTo(server.port, {
      ...options,
      infileStreamFactory: () => {
        factoryCalls++;
        return Readable.from([Buffer.from('local file contents')]);
      },
    });

    const outcome = connection
      .promise()
      .query('SELECT 1')
      .then(
        () => 'resolved',
        (error: Error & { code?: string }) => error.code
      );

    await it('fails the query without reading the file', async () => {
      await server.waitForPackets(1);
      server.reply(1, Buffer.from('\xfbrequested.csv', 'latin1'));

      strict.equal(await outcome, 'PROTOCOL_UNREQUESTED_LOCAL_INFILE');
      strict.equal(factoryCalls, 0);
      strict.equal(server.state.clientFlags & ClientConstants.LOCAL_FILES, 0);
      strict.deepEqual(
        server.received.map((packet) => packet.type),
        [COM_QUERY]
      );
    });

    connection.destroy();
    await server.close();
  });
}
