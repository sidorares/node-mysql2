var config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.CI ? process.env.MYSQL_PASSWORD : '',
  database: process.env.MYSQL_DATABASE || 'test',
  port: process.env.MYSQL_PORT || 3306
};

module.exports.SqlString = require('../lib/sql_string.js');

module.exports.createConnection = function(args, callback) {
  // hrtime polyfill for old node versions:
  if (!process.hrtime)
    process.hrtime = function(start) {
      start = [0, 0] || start;
      var timestamp = Date.now();
      var seconds = Math.ceil(timestamp/1000);
      return [seconds - start[0], (timestamp-seconds*1000)*1000 - start[1]];
    };

  if (process.env.BENCHMARK_MARIA) {
    var Client = require('mariasql');
    var c = new Client();
    c.connect({
      host: config.host,
      user: config.user,
      password: config.password,
      db: config.database
    });
    //c.on('connect', function() {
    //
    //});
    setTimeout( function() {
    console.log('altering client...');
    c.oldQuery = c.query;
    c.query = function(sql, callback) {
      var rows = [];
      var q = c.oldQuery(sql);
      q.on('result', function(res) {
        res.on('row', function(row) { rows.push(row); });
        res.on('end', function() {
          callback(null, rows);
        });
      });
    };
    }, 1000);
    return c;
  }

  var driver = require('../index.js');
  if (process.env.BENCHMARK_MYSQL1)
    driver = require('mysql');

  return driver.createConnection({
    host: config.host,
    user: (args && args.user) || config.user,
    password: (args && args.password) || config.password,
    database: (args && args.database) || config.database,
    multipleStatements: args ? args.multipleStatements : false,
    port: (args && args.port) || config.port,
    debug: process.env.DEBUG,
    supportBigNumbers: args && args.supportBigNumbers,
    bigNumberStrings: args && args.bigNumberStrings,
    dateStrings: args && args.dateStrings
  });
};

module.exports.createPool = function(callback) {
  var driver = require('../index.js');
  if (process.env.BENCHMARK_MYSQL1)
    driver = require('mysql');

  return driver.createPool(config);
};

module.exports.createTemplate = function() {
  var jade = require('jade');
  var template = require('fs').readFileSync(__dirname + '/template.jade', 'ascii');
  return jade.compile(template);
};

module.exports.createServer = function(onListening, handler) {
  var server = require('../index.js').createServer();
  server.on('connection', function(conn) {
    conn.on('error', function() {
      // we are here when client drops connection
    });
    conn.serverHandshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff
    });
    if (handler)
      handler(conn);
  });
  server.listen(3307, onListening);
  return server;
};

module.exports.useTestDb = function(cb) {
  // no-op in my setup, need it for compatibility with node-mysql tests
};
