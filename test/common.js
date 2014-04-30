var config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.CI ? null : process.env.MYSQL_PASSWORD || 'test',
  database: process.env.MYSQL_DATABASE || 'test',
  port: process.env.MYSQL_PORT || 3306
}

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
        res.on('row', function(row) { rows.push(row) });
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
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: args ? args.multipleStatements : false,
    port: (args && args.port) || config.port,
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

module.exports.createServer = function(cb) {
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
    conn.on('query', function(sql) {
      conn.writeTextResult([ { '1': '1' } ], [ { catalog: 'def',
       schema: '',
       table: '',
       orgTable: '',
       name: '1',
       orgName: '',
       characterSet: 63,
       columnLength: 1,
       columnType: 8,
       flags: 129,
       decimals: 0 } ]);
    });
    //conn.on('end', );
  });
  server.listen(3307, undefined, undefined, cb);
  return server;
}

module.exports.useTestDb = function(cb) {
  // no-op in my setup, need it for compatibility with node-mysql tests
}

module.exports.hrdiff = function(t1, t2) {
  return t2[1] - t1[1] + (t2[0] - t1[0])*1e9;
};
