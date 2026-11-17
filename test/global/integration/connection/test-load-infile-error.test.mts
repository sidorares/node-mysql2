import type {
  Connection,
  ResultSetHeader,
  RowDataPacket,
} from '../../../../index.js';
import process from 'node:process';
import { Readable } from 'node:stream';
import { describe, it, skip, strict } from 'poku';
import { createConnection } from '../../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

const table = 'load_infile_error_test';
const load = `LOAD DATA LOCAL INFILE 'missing.csv' INTO TABLE ${table} (id)`;
const noFactoryMessage = /you must provide streamFactory option/;

const createFailingStream = () =>
  new Readable({
    read() {
      this.destroy(new Error('stream failed'));
    },
  });

const isStillUsable = async (connection: Connection) => {
  const [rows] = await connection
    .promise()
    .query<RowDataPacket[]>('SELECT 1 AS ok');
  return rows[0].ok === 1;
};

await describe('Load Infile error', async () => {
  const connection = createConnection({ multipleStatements: true });
  const promiseConnection = connection.promise();
  const connectionErrors: Error[] = [];

  connection.on('error', (err) => connectionErrors.push(err));

  const [savedLocalInfile] = await promiseConnection.query<RowDataPacket[]>(
    'SELECT @@GLOBAL.local_infile as backup'
  );
  const originalLocalInfile = savedLocalInfile[0].backup;

  await promiseConnection.query('SET GLOBAL local_infile = true');
  await promiseConnection.query(`CREATE TEMPORARY TABLE ${table} (id INT)`);

  await it('consumes the statements that follow a missing stream factory', async () => {
    await strict.rejects(
      promiseConnection.query(`${load}; SELECT 'after' AS s`),
      noFactoryMessage
    );
    strict.equal(await isStillUsable(connection), true);
  });

  await it('consumes the statements that follow a failing stream', async () => {
    await strict.rejects(
      promiseConnection.query({
        sql: `${load}; SELECT 'after' AS s`,
        infileStreamFactory: createFailingStream,
      }),
      /stream failed/
    );
    strict.equal(await isStillUsable(connection), true);
  });

  await it('reports the first of two failures', async () => {
    await strict.rejects(
      promiseConnection.query(
        `LOAD DATA LOCAL INFILE 'first.csv' INTO TABLE ${table} (id); LOAD DATA LOCAL INFILE 'second.csv' INTO TABLE ${table} (id); SELECT 'after' AS s`
      ),
      /first\.csv/
    );
    strict.equal(await isStillUsable(connection), true);
  });

  await it('sends no file for a statement that follows a failure', async () => {
    const requested: string[] = [];

    await strict.rejects(
      promiseConnection.query({
        sql: `LOAD DATA LOCAL INFILE 'first.csv' INTO TABLE ${table} (id); LOAD DATA LOCAL INFILE 'second.csv' INTO TABLE ${table} (id)`,
        infileStreamFactory: (path) => {
          requested.push(path);
          return path === 'first.csv'
            ? createFailingStream()
            : Readable.from([Buffer.from('1\n2\n')]);
        },
      }),
      /stream failed/
    );

    const [rows] = await promiseConnection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS loaded FROM ${table}`
    );

    strict.deepEqual(requested, ['first.csv']);
    strict.equal(rows[0].loaded, 0);
  });

  await it('ignores a stream error raised after the file was sent', async () => {
    const [result] = await promiseConnection.query<ResultSetHeader>({
      sql: `LOAD DATA LOCAL INFILE 'late.csv' INTO TABLE ${table} (id); SELECT 'after' AS s`,
      infileStreamFactory: () => {
        const stream = Readable.from([Buffer.from('7\n')]);
        // after every 'end' listener has run, so the file is already sent
        stream.once('end', () =>
          process.nextTick(() => stream.emit('error', new Error('too late')))
        );
        return stream;
      },
    });

    strict.equal(Array.isArray(result), true);
    strict.equal(await isStillUsable(connection), true);
    await promiseConnection.query(`DELETE FROM ${table}`);
  });

  await it('clears the query timeout', async () => {
    const pendingTimeout = await new Promise((resolve) => {
      const query = connection.query(
        { sql: load, timeout: 60000 },
        // @ts-expect-error: internal access
        () => resolve(query.queryTimeout)
      );
    });

    strict.equal(pendingTimeout, null);
  });

  it('the connection reports no protocol error', () => {
    strict.deepEqual(connectionErrors, []);
  });

  await promiseConnection.query('SET GLOBAL local_infile = ?', [
    originalLocalInfile,
  ]);
  await promiseConnection.end();
});
