'use strict';

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const disableEval = process.env.STATIC_PARSER === '1';

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: (process.env.CI ? process.env.MYSQL_PASSWORD : '') || '',
  database: process.env.MYSQL_DATABASE || 'test',
  compress: process.env.MYSQL_USE_COMPRESSION === '1',
  port: process.env.MYSQL_PORT || 3306,
  disableEval,
};

if (process.env.MYSQL_USE_TLS === '1') {
  config.ssl = {
    rejectUnauthorized: false,
    ca: fs.readFileSync(
      path.join(__dirname, '../test/fixtures/ssl/certs/ca.pem'),
      'utf-8'
    ),
  };
}

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

  const params = {
    host: args.host || config.host,
    rowsAsArray: args.rowsAsArray,
    user: (args && args.user) || config.user,
    password: (args && args.password) || config.password,
    database: (args && args.database) || config.database,
    multipleStatements: args ? args.multipleStatements : false,
    port: (args && args.port) || config.port,
    debug: process.env.DEBUG || (args && args.debug),
    supportBigNumbers: args && args.supportBigNumbers,
    bigNumberStrings: args && args.bigNumberStrings,
    compress: (args && args.compress) || config.compress,
    decimalNumbers: args && args.decimalNumbers,
    charset: args && args.charset,
    timezone: args && args.timezone,
    dateStrings: args && args.dateStrings,
    authSwitchHandler: args && args.authSwitchHandler,
    typeCast: args && args.typeCast,
    namedPlaceholders: args && args.namedPlaceholders,
    connectTimeout: args && args.connectTimeout,
    nestTables: args && args.nestTables,
    ssl: (args && args.ssl) ?? config.ssl,
    jsonStrings: args && args.jsonStrings,
    disableEval,
    flags: args && args.flags,
  };

  const conn = driver.createConnection(params);
  return conn;
};
