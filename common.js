'use strict';

const Connection = require('./lib/connection.js');
const ConnectionConfig = require('./lib/connection_config.js');
const Pool = require('./lib/pool');
const PoolConfig = require('./lib/pool_config');
const PoolCluster = require('./lib/pool_cluster');

exports.Connection = Connection;
exports.createConnection = function(opts) {
  return new Connection({ config: new ConnectionConfig(opts) });
};
exports.createPool = function(config) {
  return new Pool({ config: new PoolConfig(config) });
};
exports.createPoolCluster = function(config) {
  const PoolCluster = require('./lib/pool_cluster.js');
  return new PoolCluster(config);
};
