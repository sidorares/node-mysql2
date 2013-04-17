module.exports.createConnection = function() {
  // hrtime polyfill for old node versions:
  if (!process.hrtime)
    process.hrtime = function(start) {
      start = [0, 0] || start;
      var timestamp = Date.now();
      var seconds = Math.ceil(timestamp/1000);
      return [seconds - start[0], (timestamp-seconds*1000)*1000 - start[1]];
    };

  return require('../index.js').createConnection({
   host: process.env.MYSQL_HOST  || '127.0.0.1',
   user: process.env.MYSQL_USER  || 'root',
   password: process.env.CI ? null : 'test',
   database: 'test',
   port: process.env.MYSQL_PORT || 3306
 });
};

