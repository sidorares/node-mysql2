import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
export * as SqlString from 'sql-escaper';
import ClientFlags from '../../lib/constants/client.js';
import portfinder from 'portfinder';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const require = createRequire(import.meta.url);

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
      path.join(__dirname, '../../test/fixtures/ssl/certs/ca.pem'),
      'utf-8'
    ),
  };
}

export { config };

const encUser = encodeURIComponent(config.user ?? '');
const encPass = encodeURIComponent(config.password ?? '');
const host = config.host;
const port = config.port;
const db = config.database;

const configURI = `mysql://${encUser}:${encPass}@${host}:${port}/${db}`;

export const createConnection = function (args) {
  const driver = require('../../index.js');
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

export const waitDatabaseReady = function (callback) {
  const start = Date.now();
  const timeout = 300000; // 5 minutes in milliseconds

  const tryConnect = function () {
    if (Date.now() - start > timeout) {
      console.log('Connection attempt timed out after 5 minutes.');
      process.exit(1);
    }

    const conn = createConnection({
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

export const getConfig = function (input) {
  const args = input || {};
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
    connectionLimit: args && args.connectionLimit,
    maxIdle: args && args.maxIdle,
    idleTimeout: args && args.idleTimeout,
    jsonStrings: args && args.jsonStrings,
    disableEval,
    gracefulEnd: args && args.gracefulEnd,
  };

  return params;
};

export const createPool = function (args) {
  let driver = require('../../index.js');

  if (!args?.port && process.env.MYSQL_CONNECTION_URL) {
    return driver.createPool({
      ...args,
      uri: process.env.MYSQL_CONNECTION_URL,
    });
  }

  if (!args) {
    args = {};
  }

  if (process.env.BENCHMARK_MYSQL1) {
    driver = require('mysql');
  }

  return driver.createPool(getConfig(args));
};

export const createPoolCluster = function (args = {}) {
  const driver = require('../../index.js');

  if (!args?.port && process.env.MYSQL_CONNECTION_URL) {
    return driver.createPoolCluster({
      ...args,
      uri: process.env.MYSQL_CONNECTION_URL,
    });
  }

  return driver.createPoolCluster(args);
};

export const createConnectionWithURI = function () {
  const driver = require('../../index.js');

  return driver.createConnection({ uri: configURI });
};

export const createTemplate = function () {
  const jade = require('jade');
  const template = fs.readFileSync(`${__dirname}/../template.jade`, 'ascii');

  return jade.compile(template);
};

export const createServer = function (onListening, handler) {
  const server = require('../../index.js').createServer();
  server.on('connection', (conn) => {
    conn.on('error', () => {
      // server side of the connection
      // ignore disconnects
    });
    // remove ssl bit from the flags
    let flags = 0xffffff;
    flags = flags ^ (ClientFlags.COMPRESS | ClientFlags.SSL);

    conn.serverHandshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: flags,
    });
    if (handler) {
      handler(conn);
    }
  });
  portfinder.getPort((err, port) => {
    server.listen(port, onListening);
  });
  return server;
};

export const useTestDb = function () {
  // no-op in my setup, need it for compatibility with node-mysql tests
};

export const version = Number(process.version.match(/v(\d+)\./)?.[1]);

export const getMysqlVersion = async function (connection) {
  const conn = connection.promise ? connection.promise() : connection;

  const [rows] = await conn.query('SELECT VERSION() AS `version`');
  const serverVersion = rows[0].version;

  const [major, minor, patch] = serverVersion
    .split('.')
    .map((x) => parseInt(x, 10));

  return {
    major,
    minor,
    patch,
  };
};

const pad = (number, length = 2) => String(number).padStart(length, '0');

export const localDate = (date) => {
  const year = pad(date.getFullYear(), 4);
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  const millisecond = pad(date.getMilliseconds(), 3);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}`;
};
