'use strict';

const { assert, describe, beforeEach, afterEach, it } = require('poku');
const common = require('../../common.test.cjs');

const { database: currentDatabase } = common.config;

describe('test stream error destroy connection:', async () => {
  let connection;

  beforeEach(() => (connection = common.createConnection()));

  afterEach(async () => {
    await connection.end();
  });

  await it('Ensure stream ends in case of error', async () => {
    connection.query(
      [
        'CREATE TEMPORARY TABLE `items` (',
        '`id` int(11) NOT NULL AUTO_INCREMENT,',
        '`text` varchar(255) DEFAULT NULL,',
        'PRIMARY KEY (`id`)',
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
      ].join('\n'),
      (err) => {
        if (err) {
          throw err;
        }
      }
    );

    for (let i = 0; i < 100; i++) {
      connection.execute(
        'INSERT INTO items(text) VALUES(?)',
        ['test'],
        (err) => {
          if (err) {
            throw err;
          }
        }
      );
    }

    const rows = connection.query('SELECT * FROM items').stream();

    // eslint-disable-next-line no-unused-vars
    for await (const _ of rows) break; // forces return () -> destroy()
  });

  await it('end: Ensure stream emits error then close on server-side query error', async () => {
    let uncaughtExceptionError;

    const stream = connection
      .query('SELECT invalid_column FROM invalid_table')
      .stream();

    stream.on('error', (error) => {
      uncaughtExceptionError = error;
    });

    await new Promise((resolve) => stream.on('end', resolve));

    assert(
      uncaughtExceptionError instanceof Error,
      'Expected an uncaught exception error'
    );

    assert.equal(
      uncaughtExceptionError.message,
      `Table '${currentDatabase}.invalid_table' doesn't exist`
    );
  });

  await it('close: Ensure stream emits error then close on server-side query error', async () => {
    let uncaughtExceptionError;

    const stream = connection
      .query('SELECT invalid_column FROM invalid_table')
      .stream();

    stream.on('error', (error) => {
      uncaughtExceptionError = error;
    });

    await new Promise((resolve) => stream.on('close', resolve));

    assert(
      uncaughtExceptionError instanceof Error,
      'Expected an uncaught exception error'
    );

    assert.equal(
      uncaughtExceptionError.message,
      `Table '${currentDatabase}.invalid_table' doesn't exist`
    );
  });
});
