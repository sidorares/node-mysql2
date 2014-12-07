var Connection       = require('./lib/connection.js');
var ConnectionConfig = require('./lib/connection_config.js');
var SqlString        = require('./lib/sql_string.js');

module.exports.createConnection = function(opts) {
  return new Connection({config: new ConnectionConfig(opts)});
};

module.exports.connect = module.exports.createConnection;

module.exports.Connection = Connection;
module.exports.Types      = require('./lib/constants/types.js');

module.exports.createPool = function(config) {
  var PoolConfig = require('./lib/pool_config.js');
  var Pool       = require('./lib/pool.js');
  return new Pool({config: new PoolConfig(config)});
};

exports.createPoolCluster = function(config) {
  var PoolCluster = require('./lib/pool_cluster.js');
  return new PoolCluster(config);
};

module.exports.createServer = function() {
  var Server = require('./lib/server.js');
  return new Server();
};

exports.escape   = SqlString.escape;
exports.escapeId = SqlString.escapeId;
exports.format   = SqlString.format;
