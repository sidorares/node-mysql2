import type {
  Connection,
  ResultSetHeader,
  RowDataPacket,
} from '../../../../index.js';
import process from 'node:process';
import { PassThrough, Readable } from 'node:stream';
import { describe, it, skip, strict } from 'poku';
import { createConnection, getMysqlVersion } from '../../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

const table = 'load_infile_stream_cleanup_test';
const rejectingTable = `${table}_rejecting`;
const load = `LOAD DATA LOCAL INFILE 'rows.csv' INTO TABLE ${table} (id)`;

const createRows = () => Readable.from([Buffer.from('1\n2\n')]);

const hasNoLoadListeners = (stream: Readable) =>
  stream.listenerCount('data') === 0 && stream.listenerCount('end') === 0;

await describe('Load Infile stream clean-up', async () => {
  const connection = createConnection({ multipleStatements: true });
  const promiseConnection = connection.promise();
  const { isMariaDB } = await getMysqlVersion(promiseConnection);

  const [savedLocalInfile] = await promiseConnection.query<RowDataPacket[]>(
    'SELECT @@GLOBAL.local_infile as backup'
  );
  const originalLocalInfile = savedLocalInfile[0].backup;

  await promiseConnection.query('SET GLOBAL local_infile = true');
  await promiseConnection.query(`DROP TABLE IF EXISTS ${table}`);
  await promiseConnection.query(`CREATE TABLE ${table} (id INT)`);
  await promiseConnection.query(`DROP TABLE IF EXISTS ${rejectingTable}`);
  await promiseConnection.query(`CREATE TABLE ${rejectingTable} (id INT)`);
  await promiseConnection.query(
    `CREATE TRIGGER ${rejectingTable}_reject BEFORE INSERT ON ${rejectingTable} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'row rejected'`
  );

  // @ts-expect-error: internal access
  const socket = connection.stream;
  const socketListeners = () => ({
    pause: socket.listenerCount('pause'),
    drain: socket.listenerCount('drain'),
    close: socket.listenerCount('close'),
  });
  const initialSocketListeners = socketListeners();

  const loadFiles = async (count: number) => {
    const streams: Readable[] = [];

    await promiseConnection.query({
      sql: Array.from({ length: count }, () => load).join('; '),
      infileStreamFactory: () => {
        const stream = createRows();
        streams.push(stream);
        return stream;
      },
    });

    return streams;
  };

  await it('releases every stream of a query with several loads', async () => {
    const streams = await loadFiles(3);

    strict.equal(streams.length, 3);
    strict.equal(streams.every(hasNoLoadListeners), true);
    strict.deepEqual(socketListeners(), initialSocketListeners);
  });

  await it('leaves nothing on the socket when the query is repeated', async () => {
    await loadFiles(3);
    await loadFiles(3);

    strict.deepEqual(socketListeners(), initialSocketListeners);
  });

  await it('keeps no listener per load on the command', async () => {
    const warnings: Error[] = [];
    const onWarning = (warning: Error) => warnings.push(warning);

    process.on('warning', onWarning);
    const streams = await loadFiles(12);
    await new Promise((resolve) => setImmediate(resolve));
    process.removeListener('warning', onWarning);

    strict.equal(streams.length, 12);
    strict.deepEqual(
      warnings.filter(
        (warning) => warning.name === 'MaxListenersExceededWarning'
      ),
      []
    );
  });

  await it('loads every file', async () => {
    const [rows] = await promiseConnection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS loaded FROM ${table}`
    );

    strict.equal(rows[0].loaded, 42);
  });

  await it('releases the stream of a load the server rejects', async () => {
    const stream = createRows();

    await strict.rejects(
      promiseConnection.query({
        sql: `LOAD DATA LOCAL INFILE 'rows.csv' INTO TABLE ${rejectingTable} (id)`,
        infileStreamFactory: () => stream,
      }),
      /row rejected/
    );

    strict.equal(hasNoLoadListeners(stream), true);
    strict.deepEqual(socketListeners(), initialSocketListeners);
    strict.doesNotThrow(() => stream.emit('error', new Error('too late')));
  });

  if (isMariaDB) {
    await it('loads a file through execute', async () => {
      const stream = createRows();
      const [result] = await promiseConnection.execute<ResultSetHeader>({
        sql: load,
        infileStreamFactory: () => stream,
      });

      strict.equal(result.affectedRows, 2);
      strict.equal(hasNoLoadListeners(stream), true);
      strict.deepEqual(socketListeners(), initialSocketListeners);
    });
  }

  await promiseConnection.query(`DROP TABLE IF EXISTS ${rejectingTable}`);
  await promiseConnection.query('SET GLOBAL local_infile = ?', [
    originalLocalInfile,
  ]);

  await promiseConnection.query('SET GLOBAL local_infile = true');

  const endConnectionDuringLoad = {
    'the server': async (lostConnection: Connection) => {
      await promiseConnection.query(
        `KILL CONNECTION ${lostConnection.threadId}`
      );
    },
    'a socket error': (lostConnection: Connection) => {
      // @ts-expect-error: internal access
      lostConnection.stream.destroy(new Error('socket failed'));
    },
    'the application': (lostConnection: Connection, stream: PassThrough) => {
      lostConnection.destroy();
      stream.write('2\n');
    },
  };

  for (const [cause, endConnection] of Object.entries(
    endConnectionDuringLoad
  )) {
    await describe(`when ${cause} ends the connection during a load`, async () => {
      const lostConnection = createConnection();
      lostConnection.on('error', () => {});
      await lostConnection.promise().query('SELECT 1');
      // @ts-expect-error: internal access
      const lostSocket = lostConnection.stream;
      const lostSocketClosed = new Promise<void>((resolve) => {
        lostSocket.once('close', () => resolve());
      });
      const stream = new PassThrough();

      const failure = new Promise<Error | null>((resolve) => {
        lostConnection.query(
          { sql: load, infileStreamFactory: () => stream },
          (err) => resolve(err)
        );
      });
      await new Promise<void>((resolve) => stream.once('resume', resolve));
      stream.write('1\n');
      await endConnection(lostConnection, stream);
      const err = await failure;

      it('fails the load', () => {
        strict.ok(err instanceof Error);
      });

      it('ignores a stream error raised before the socket has closed', () => {
        strict.doesNotThrow(() => stream.emit('error', new Error('too late')));
        strict.equal(hasNoLoadListeners(stream), true);
      });

      await lostSocketClosed;

      it('ignores a stream error raised after the socket has closed', () => {
        strict.doesNotThrow(() => stream.emit('error', new Error('too late')));
      });

      lostConnection.destroy();
    });
  }

  await promiseConnection.query('SET GLOBAL local_infile = ?', [
    originalLocalInfile,
  ]);
  await promiseConnection.query(`DROP TABLE IF EXISTS ${table}`);
  await promiseConnection.end();
});
