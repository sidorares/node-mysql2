var Connection = require('./lib/connection');
module.exports.createConnection = function(opts) {
  return new Connection(opts);
};

module.exports.Connection = Connection;
module.exports.Types      = require('./lib/constants/types');;
