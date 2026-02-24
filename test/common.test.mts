import type {
  Connection,
  ConnectionOptions,
  PoolClusterOptions,
  PoolOptions,
} from '../index.js';
import type {
  Connection as PromiseConnection,
  RowDataPacket,
} from '../promise.js';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import driver from '../index.js';
import ClientFlags from '../lib/constants/client.js';

export * as SqlString from 'sql-escaper';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const require = createRequire(import.meta.url);

const disableEval: boolean = process.env.STATIC_PARSER === '1';

const config: {
  host: string;
  user: string;
  password: string;
  database: string;
  compress: boolean;
  port: number;
  disableEval: boolean;
  ssl?: {
    rejectUnauthorized: boolean;
    ca: string;
  };
} = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: (process.env.CI ? process.env.MYSQL_PASSWORD : '') || '',
  database: process.env.MYSQL_DATABASE || 'test',
  compress: process.env.MYSQL_USE_COMPRESSION === '1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  disableEval,
};

if (process.env.MYSQL_USE_TLS === '1') {
  config.ssl = {
    rejectUnauthorized: false,
    ca: fs.readFileSync(
      path.join(__dirname, 'fixtures/ssl/certs/ca.pem'),
      'utf-8'
    ),
  };
}

export { config };

const encUser: string = encodeURIComponent(config.user ?? '');
const encPass: string = encodeURIComponent(config.password ?? '');
const host: string = config.host;
const port: number = config.port;
const db: string = config.database;

const configURI: string = `mysql://${encUser}:${encPass}@${host}:${port}/${db}`;

export const createConnection = function (args?: ConnectionOptions) {
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

export const waitDatabaseReady = function (callback: () => void) {
  const start: number = Date.now();
  const timeout: number = 300000; // 5 minutes in milliseconds

  const tryConnect = function () {
    if (Date.now() - start > timeout) {
      console.log('Connection attempt timed out after 5 minutes.');
      process.exit(1);
    }

    const conn = createConnection({
      database: 'mysql',
      password: process.env.MYSQL_PASSWORD,
    });

    conn.once('error', (err: Error & { code?: string }) => {
      if (
        err.code !== 'PROTOCOL_CONNECTION_LOST' &&
        err.code !== 'ETIMEDOUT' &&
        err.code !== 'ECONNREFUSED'
      ) {
        console.log('Unexpected error waiting for connection', err);
        process.exit(-1);
      }

      try {
        conn.end();
      } catch (err) {
        console.log(err);
      }

      console.log('not ready');
      setTimeout(tryConnect, 1000);
    });

    conn.once('connect', () => {
      console.log(`ready after ${Date.now() - start}ms!`);
      conn.end();
      callback();
    });
  };

  tryConnect();
};

export const getConfig = function (input?: ConnectionOptions) {
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

export const createPool = function (
  args?: PoolOptions
): ReturnType<typeof driver.createPool> {
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
    const mysql1 = require('mysql');
    return mysql1.createPool(getConfig(args));
  }

  return driver.createPool(getConfig(args));
};

export const createPoolCluster = function (
  args: PoolClusterOptions = {}
): ReturnType<typeof driver.createPoolCluster> {
  if (!('port' in args) && process.env.MYSQL_CONNECTION_URL) {
    return driver.createPoolCluster({
      ...args,
      // @ts-expect-error: TODO: implement typings
      uri: process.env.MYSQL_CONNECTION_URL,
    });
  }

  return driver.createPoolCluster(args);
};

export const createConnectionWithURI = function (): ReturnType<
  typeof driver.createConnection
> {
  return driver.createConnection({ uri: configURI });
};

export const createTemplate = function () {
  const jade = require('jade');
  const template = fs.readFileSync(`${__dirname}/template.jade`, 'ascii');

  return jade.compile(template);
};

export const createServer = function (
  onListening: () => void,
  handler?: (conn: Connection) => void
) {
  // @ts-expect-error: TODO: implement typings
  const server = driver.createServer();
  server.on('connection', (conn: Connection) => {
    conn.on('error', () => {
      // server side of the connection
      // ignore disconnects
    });

    // remove ssl bit from the flags
    let flags: number = 0xffffff;
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

  // @ts-expect-error: TODO: implement typings
  server.listen(0, () => {
    // @ts-expect-error: internal access
    server._port = server._server.address().port;
    onListening();
  });

  return server;
};

export const useTestDb = function () {
  // no-op in my setup, need it for compatibility with node-mysql tests
};

export const version: number = Number(process.version.match(/v(\d+)\./)?.[1]);

export const getMysqlVersion = async function (
  connection: Connection | PromiseConnection
) {
  const conn = 'promise' in connection ? connection.promise() : connection;
  const [rows] = await conn.query<(RowDataPacket & { version: string })[]>(
    'SELECT VERSION() AS `version`'
  );
  const serverVersion: string = rows[0].version;

  const [major, minor, patch] = serverVersion
    .split('.')
    .map((x) => parseInt(x, 10));

  return {
    major,
    minor,
    patch,
  };
};

const pad = (number: number, length: number = 2): string =>
  String(number).padStart(length, '0');

export const localDate = (date: Date): string => {
  const year: string = pad(date.getFullYear(), 4);
  const month: string = pad(date.getMonth() + 1);
  const day: string = pad(date.getDate());
  const hour: string = pad(date.getHours());
  const minute: string = pad(date.getMinutes());
  const second: string = pad(date.getSeconds());
  const millisecond: string = pad(date.getMilliseconds(), 3);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}`;
};
