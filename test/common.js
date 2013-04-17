module.exports.createConnection = function() {
  return require('../index.js').createConnection({
   host: process.env.MYSQL_HOST  || '127.0.0.1',
   user: process.env.MYSQL_USER  || 'root',
   password: process.env.CI ? null : 'test',
   database: 'test',
   port: process.env.MYSQL_PORT || 3306
 });
};

