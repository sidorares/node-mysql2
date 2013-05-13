var Connection = require('./lib/connection');
var ConnectionConfig = require('./lib/connection_config');
module.exports.createConnection = function(opts) {
  return new Connection({config: new ConnectionConfig(opts)});
  //return new Connection(opts);
};

module.exports.connect = module.exports.createConnection;

module.exports.Connection = Connection;
module.exports.Types      = require('./lib/constants/types');

var PoolConfig = require('./lib/pool_config');
var Pool = require('./lib/pool');
module.exports.createPool = function(config) {
    return new Pool({config: new PoolConfig(config)});
};

var Server = require('./lib/server');
module.exports.createServer = function() {
  return new Server();
};
