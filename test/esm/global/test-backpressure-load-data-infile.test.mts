import type {
  QueryError,
  ResultSetHeader,
  RowDataPacket,
} from '../../../index.js';
import Net from 'node:net';
import { Duplex, Readable } from 'node:stream';
import { assert, log, skip, sleep, test } from 'poku';
import driver from '../../../index.js';
import { config } from '../common.test.mjs';

if (config.compress) {
  skip(
    'skipping test with compression; load data infile backpressure is not working with compression'
  );
}

class BigInput extends Readable {
  count = 0;
  MAX_EXPECTED_ROWS = 100_000;
  onStart: (() => void) | null = null;

  _read() {
    if (this.onStart) {
      this.onStart();
      this.onStart = null;
    }

    if (this.count < this.MAX_EXPECTED_ROWS) {
      this.count++;
      const row = `${this.count}\n`;
      this.push(row);
    } else {
      this.push(null);
    }
  }
}

await test('load data infile backpressure on local stream', async () => {
  const setupConn = driver.createConnection(config);
  const [savedRows] = await setupConn
    .promise()
    .query<RowDataPacket[]>('SELECT @@GLOBAL.local_infile as backup');
  const originalLocalInfile = savedRows[0].backup;

  await setupConn.promise().query('SET GLOBAL local_infile = 1');

  const netStream = Net.connect(config.port, config.host);
  netStream.setNoDelay(true);
  await new Promise<void>((resolve, reject) =>
    netStream.once('connect', resolve).once('error', reject)
  );

  class NetworkInterceptor extends Duplex {
    simulateWriteBackpressure = false;

    constructor() {
      super({ writableHighWaterMark: 65536 });
      netStream.on('data', (data: Buffer) => {
        const continueReading = this.push(data);
        if (!continueReading) {
          netStream.pause();
        }
      });
      netStream.on('error', (err: Error) => this.destroy(err));
    }

    _read() {
      netStream.resume();
    }

    _write(
      chunk: Buffer,
      encoding: BufferEncoding,
      callback: (err?: Error | null) => void
    ) {
      netStream.write(chunk, encoding, (err?: Error | null) => {
        if (err) {
          callback(err);
        } else if (!this.simulateWriteBackpressure) {
          callback();
        }
      });
    }
  }

  const interceptor = new NetworkInterceptor();
  const connection = driver.createConnection({
    ...config,
    multipleStatements: true,
    stream: interceptor,
  });

  const bigInput = new BigInput();
  bigInput.onStart = () => (interceptor.simulateWriteBackpressure = true);

  connection.query(
    {
      sql: `
      create temporary table test_load_data_backpressure (id varchar(100));
      load data local infile "_" replace into table test_load_data_backpressure;
    `,
      infileStreamFactory: () => bigInput,
    },
    (err: QueryError | null, result: ResultSetHeader[]) => {
      if (err) throw err;
      log('Load complete', result);
    }
  );

  await sleep(1000); // allow time for backpressure to take effect

  // @ts-expect-error: TODO: implement typings
  connection.close();
  netStream.destroy();

  await setupConn
    .promise()
    .query('SET GLOBAL local_infile = ?', [originalLocalInfile]);
  setupConn.end();

  assert.ok(
    bigInput.count < bigInput.MAX_EXPECTED_ROWS,
    `expected backpressure to stop infile stream at less than ${bigInput.MAX_EXPECTED_ROWS} rows (read ${bigInput.count} rows)`
  );
});
