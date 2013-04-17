module.exports.createConnection = function() {
  return require('../index.js').createConnection({
   user: 'root',
   password: 'test',
   database: 'test',
   socketPath: '/tmp/mysql.sock'
 });
};

