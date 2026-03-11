import { describe, it, strict } from 'poku';
import { config, createConnection } from '../../common.test.mjs';

const { database: currentDatabase } = config;

await describe('Ensure stream ends in case of error', async () => {
  const connection = createConnection();

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
    connection.execute('INSERT INTO items(text) VALUES(?)', ['test'], (err) => {
      if (err) {
        throw err;
      }
    });
  }

  await it('should destroy stream on break', async () => {
    const rows = connection.query('SELECT * FROM items').stream();

    for await (const _ of rows) break; // forces return () -> destroy()
  });

  connection.end();
});

await describe('Ensure stream emits error then close on server-side query error (end)', async () => {
  const connection = createConnection();

  await it('should emit error then end', async () => {
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

  connection.end();
});

await describe('Ensure stream emits error then close on server-side query error (close)', async () => {
  const connection = createConnection();

  await it('should emit error then close', async () => {
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

  connection.end();
});
