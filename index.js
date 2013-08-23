var Connection = require('./lib/connection');
var ConnectionConfig = require('./lib/connection_config');

module.exports.createConnection = function(opts) {
  return new Connection({config: new ConnectionConfig(opts)});
};

module.exports.connect = module.exports.createConnection;

module.exports.Connection = Connection;
module.exports.Types      = require('./lib/constants/types');

module.exports.createPool = function(config) {
  var PoolConfig = require('./lib/pool_config');
  var Pool       = require('./lib/pool');
  return new Pool({config: new PoolConfig(config)});
};

exports.createPoolCluster = function(config) {
  var PoolConfig  = require('./lib/pool_config');
  var PoolCluster = require('./lib/pool_cluster');
  return new PoolCluster(config);
};

module.exports.createServer = function() {
  var Server = require('./lib/server');
  return new Server();
};
