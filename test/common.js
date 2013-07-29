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
      host: '127.0.0.1',
      user: 'root',
      password: 'test',
      db: 'test'
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
   host: process.env.MYSQL_HOST  || '127.0.0.1',
   user: process.env.MYSQL_USER  || 'root',
   password: process.env.CI ? null : '',
   database: 'test',
   multipleStatements: args ? args.multipleStatements : false,
   port: process.env.MYSQL_PORT || 3306
 });
};

module.exports.createPool = function(callback) {
  var driver = require('../index.js');
  if (process.env.BENCHMARK_MYSQL1)
    driver = require('mysql');

  return driver.createPool({
   host: process.env.MYSQL_HOST  || '127.0.0.1',
   user: process.env.MYSQL_USER  || 'root',
   password: process.env.CI ? null : 'test',
   database: 'test',
   port: process.env.MYSQL_PORT || 3306
 });
};

module.exports.createTemplate = function() {
  var jade = require('jade');
  var template = require('fs').readFileSync(__dirname + '/template.jade', 'ascii');
  return jade.compile(template);
};

module.exports.hrdiff = function(t1, t2) {
  return t2[1] - t1[1] + (t2[0] - t1[0])*1e9;
};
