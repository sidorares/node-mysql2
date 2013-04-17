var Connection = require('./lib/connection');
module.exports.createConnection = function(opts) {
  return new Connection(opts);
};
