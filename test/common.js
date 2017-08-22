var config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.CI ? process.env.MYSQL_PASSWORD : '',
  database: process.env.MYSQL_DATABASE || 'test',
  compress: process.env.MYSQL_USE_COMPRESSION,
  port: process.env.MYSQL_PORT || 3306
};

module.exports.SqlString = require('sqlstring');
module.exports.config = config;

module.exports.waitDatabaseReady = function(callback) {
  const tryConnect = function() {
    const conn = module.exports.createConnection();
    conn.on('error', function(err) {
      console.log(err);
      console.log('not ready');
      setTimeout(tryConnect, 1000);
    });
    conn.on('connect', function() {
      console.log('ready!');
      conn.close();
      callback();
    });
  };
  tryConnect();
};

module.exports.createConnection = function(args, callback) {
  if (!args) {
    args = {};
  }
  // hrtime polyfill for old node versions:
  if (!process.hrtime) {
    process.hrtime = function(start) {
      start = [0, 0] || start;
      var timestamp = Date.now();
      var seconds = Math.ceil(timestamp / 1000);
      return [
        seconds - start[0],
        (timestamp - seconds * 1000) * 1000 - start[1]
      ];
    };
  }

  if (process.env.BENCHMARK_MARIA) {
    var Client = require('mariasql');
    var c = new Client();
    c.connect({
      host: config.host,
      user: config.user,
      password: config.password,
      db: config.database
    });
    // c.on('connect', function() {
    //
    // });
    setTimeout(function() {
      console.log('altering client...');
      c.oldQuery = c.query;
      c.query = function(sql, callback) {
        var rows = [];
        var q = c.oldQuery(sql);
        q.on('result', function(res) {
          res.on('row', function(row) {
            rows.push(row);
          });
          res.on('end', function() {
            callback(null, rows);
          });
        });
      };
    }, 1000);
    return c;
  }

  var driver = require('../index.js');
  if (process.env.BENCHMARK_MYSQL1) {
    driver = require('mysql');
  }

  var params = {
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
  var conn = driver.createConnection(params);

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

module.exports.createPool = function(callback) {
  var driver = require('../index.js');
  if (process.env.BENCHMARK_MYSQL1) {
    driver = require('mysql');
  }

  return driver.createPool(config);
};

module.exports.createTemplate = function() {
  var jade = require('jade');
  var template = require('fs').readFileSync(
    __dirname + '/template.jade',
    'ascii'
  );
  return jade.compile(template);
};

var ClientFlags = require('../lib/constants/client.js');

var portfinder = require('portfinder');
module.exports.createServer = function(onListening, handler) {
  var server = require('../index.js').createServer();
  server.on('connection', function(conn) {
    conn.on('error', function() {
      // we are here when client drops connection
    });
    var flags = 0xffffff;
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
  portfinder.getPort(function(err, port) {
    server.listen(port, onListening);
  });
  return server;
};

module.exports.useTestDb = function(cb) {
  // no-op in my setup, need it for compatibility with node-mysql tests
};
