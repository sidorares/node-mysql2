'use strict';

const process = require('node:process');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: (process.env.CI ? process.env.MYSQL_PASSWORD : '') || '',
  database: process.env.MYSQL_DATABASE || 'test',
  port: process.env.MYSQL_PORT || 3306,
};

exports.waitDatabaseReady = function (callback) {
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
      callback();
    });
  };

  tryConnect();
};

exports.createConnection = function (args) {
  const driver = require('../index.js');
  if (!args?.port && process.env.MYSQL_CONNECTION_URL) {
    return driver.createConnection({
      ...args,
      uri: process.env.MYSQL_CONNECTION_URL,
    });
  }

  if (!args) {
    args = {};
  }

  const conn = driver.createConnection({ ...config, ...args });
  return conn;
};
