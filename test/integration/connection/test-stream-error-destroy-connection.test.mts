import type { Connection } from '../../../index.js';
import { afterEach, beforeEach, describe, it, strict } from 'poku';
import { config, createConnection } from '../../common.test.mjs';

const { database: currentDatabase } = config;

describe('test stream error destroy connection:', async () => {
  let connection: Connection;

  beforeEach(() => (connection = createConnection()));

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

    for await (const _ of rows) break; // forces return () -> destroy()
  });

  await it('end: Ensure stream emits error then close on server-side query error', async () => {
    const state: { uncaughtExceptionError: Error | null } = {
      uncaughtExceptionError: null,
    };

    const stream = connection
      .query('SELECT invalid_column FROM invalid_table')
      .stream();

    stream.on('error', (error: Error) => {
      state.uncaughtExceptionError = error;
    });

    await new Promise((resolve) => stream.on('end', resolve));

    const uncaughtExceptionError = state.uncaughtExceptionError;
    if (uncaughtExceptionError === null) {
      strict.fail('Expected an uncaught exception error');
    } else {
      strict.equal(
        uncaughtExceptionError.message,
        `Table '${currentDatabase}.invalid_table' doesn't exist`
      );
    }
  });

  await it('close: Ensure stream emits error then close on server-side query error', async () => {
    const state: { uncaughtExceptionError: Error | null } = {
      uncaughtExceptionError: null,
    };

    const stream = connection
      .query('SELECT invalid_column FROM invalid_table')
      .stream();

    stream.on('error', (error: Error) => {
      state.uncaughtExceptionError = error;
    });

    await new Promise((resolve) => stream.on('close', resolve));

    const uncaughtExceptionError = state.uncaughtExceptionError;
    if (uncaughtExceptionError === null) {
      strict.fail('Expected an uncaught exception error');
    } else {
      strict.equal(
        uncaughtExceptionError.message,
        `Table '${currentDatabase}.invalid_table' doesn't exist`
      );
    }
  });
});
