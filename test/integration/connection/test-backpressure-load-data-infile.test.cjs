'use strict';

const { assert, log, skip, sleep, test } = require('poku');
const common = require('../../common.test.cjs');
const { Readable, Duplex } = require('node:stream');
const Net = require('node:net');
const driver = require('../../../index.js');

if (common.config.compress) {
  skip(
    'skipping test with compression; load data infile backpressure is not working with compression'
  );
}

class BigInput extends Readable {
  count = 0;
  MAX_EXPECTED_ROWS = 100_000;
  onStart = null;

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

test('load data infile backpressure on local stream', async () => {
  const config = common.config;
  const netStream = Net.connect(config.port, config.host);
  netStream.setNoDelay(true);
  await new Promise((resolve, reject) =>
    netStream.once('connect', resolve).once('error', reject)
  );

  class NetworkInterceptor extends Duplex {
    simulateWriteBackpressure = false;

    constructor() {
      super({ writableHighWaterMark: 65536 });
      netStream.on('data', (data) => {
        const continueReading = this.push(data);
        if (!continueReading) {
          netStream.pause();
        }
      });
      netStream.on('error', (err) => this.destroy(err));
    }

    _read() {
      netStream.resume();
    }

    _write(chunk, encoding, callback) {
      netStream.write(chunk, encoding, (err) => {
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
      set global local_infile = 1;
      create temporary table test_load_data_backpressure (id varchar(100));
      load data local infile "_" replace into table test_load_data_backpressure;
    `,
      infileStreamFactory: () => bigInput,
    },
    (err, result) => {
      if (err) throw err;
      log('Load complete', result);
    }
  );

  await sleep(1000); // allow time for backpressure to take effect

  connection.close();
  netStream.destroy();

  assert.ok(
    bigInput.count < bigInput.MAX_EXPECTED_ROWS,
    `expected backpressure to stop infile stream at less than ${bigInput.MAX_EXPECTED_ROWS} rows (read ${bigInput.count} rows)`
  );
});
