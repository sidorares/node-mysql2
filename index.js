var Connection = require('./lib/connection');
module.exports.createConnection = function(opts) {
  return new Connection(opts);
};

module.exports.Connection = Connection;
module.exports.Types      = require('./lib/constants/types');


var PoolConfig = require('./lib/pool_config');
var Pool = require('./lib/pool');
module.exports.createPool = function(config) {
    return new Pool({config: new PoolConfig(config)});
};
