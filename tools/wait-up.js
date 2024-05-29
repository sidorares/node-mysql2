'use strict';

const start = Date.now();
const timeout = 300000; // 5 minutes in milliseconds

const tryConnect = function () {
  if (Date.now() - start > timeout) {
    console.log('Connection attempt timed out after 5 minutes.');
    process.exit(1);
  }

  const conn = exports.createConnection({
    database: 'mysql',
    password: process.env.MYSQL_PASSWORD,
  });

  conn.once('error', (err) => {
    if (
      err.code !== 'PROTOCOL_CONNECTION_LOST' &&
      err.code !== 'ETIMEDOUT' &&
      err.code !== 'ECONNREFUSED'
    ) {
      console.log('Unexpected error waiting for connection', err);
      process.exit(-1);
    }

    try {
      conn.close();
    } catch (err) {
      console.log(err);
    }

    console.log('not ready');
    setTimeout(tryConnect, 1000);
  });

  conn.once('connect', () => {
    console.log(`ready after ${Date.now() - start}ms!`);
    conn.close();
    console.log('ready!');
  });
};

tryConnect();
