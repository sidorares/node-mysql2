'use strict';

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: (process.env.CI ? process.env.MYSQL_PASSWORD : '') || '',
  database: process.env.MYSQL_DATABASE || 'test',
  compress: process.env.MYSQL_USE_COMPRESSION,
  port: process.env.MYSQL_PORT || 3306
};

const configURI =
  'mysql://' +
  config.user +
  ':' +
  config.password +
  '@' +
  config.host +
  ':' +
  config.port +
  '/' +
  config.database;

module.exports.SqlString = require('sqlstring');
module.exports.config = config;

module.exports.waitDatabaseReady = function(callback) {
  const tryConnect = function() {
    const conn = module.exports.createConnection();
    conn.on('error', err => {
      console.log(err);
      console.log('not ready');
      setTimeout(tryConnect, 1000);
    });
    conn.on('connect', () => {
      console.log('ready!');
      conn.close();
      callback();
    });
  };
  tryConnect();
};

module.exports.createConnection = function(args) {
  if (!args) {
    args = {};
  }
  // hrtime polyfill for old node versions:
  if (!process.hrtime) {
    process.hrtime = function(start) {
      start = [0, 0] || start;
      const timestamp = Date.now();
      const seconds = Math.ceil(timestamp / 1000);
      return [
        seconds - start[0],
        (timestamp - seconds * 1000) * 1000 - start[1]
      ];
    };
  }

  if (process.env.BENCHMARK_MARIA) {
    const Client = require('mariasql');
    const c = new Client();
    c.connect({
      host: config.host,
      user: config.user,
      password: config.password,
      db: config.database
    });
    // c.on('connect', function() {
    //
    // });
    setTimeout(() => {
      console.log('altering client...');
      c.oldQuery = c.query;
      c.query = function(sql, callback) {
        const rows = [];
        const q = c.oldQuery(sql);
        q.on('result', res => {
          res.on('row', row => {
            rows.push(row);
          });
          res.on('end', () => {
            callback(null, rows);
          });
        });
      };
    }, 1000);
    return c;
  }

  let driver = require('../index.js');
  if (process.env.BENCHMARK_MYSQL1) {
    driver = require('mysql');
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
    dateStrings: args && args.dateStrings,
    authSwitchHandler: args && args.authSwitchHandler,
    typeCast: args && args.typeCast
  };

  // console.log('cc params', params);
  const conn = driver.createConnection(params);

  /*
  conn.query('create database IF NOT EXISTS test', function (err) {
    if (err) {
      console.log('error during "create database IF NOT EXISTS test"', err);
    }
  });
  conn.query('use test', function (err) {
    if (err) {
      console.log('error during "use test"', err);
    }
  });
  */
  return conn;
};

module.exports.getConfig = function(input) {
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
    dateStrings: args && args.dateStrings,
    authSwitchHandler: args && args.authSwitchHandler,
    typeCast: args && args.typeCast
  };
  return params;
};

module.exports.createPool = function() {
  let driver = require('../index.js');
  if (process.env.BENCHMARK_MYSQL1) {
    driver = require('mysql');
  }

  return driver.createPool(config);
};

module.exports.createConnectionWithURI = function() {
  const driver = require('../index.js');

  return driver.createConnection({ uri: configURI });
};

module.exports.createTemplate = function() {
  const jade = require('jade');
  const template = require('fs').readFileSync(
    __dirname + '/template.jade',
    'ascii'
  );
  return jade.compile(template);
};

const ClientFlags = require('../lib/constants/client.js');

const portfinder = require('portfinder');
module.exports.createServer = function(onListening, handler) {
  const server = require('../index.js').createServer();
  server.on('connection', conn => {
    conn.on('error', () => {
      // we are here when client drops connection
    });
    let flags = 0xffffff;
    flags = flags ^ ClientFlags.COMPRESS;

    conn.serverHandshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: flags
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

module.exports.useTestDb = function() {
  // no-op in my setup, need it for compatibility with node-mysql tests
};
