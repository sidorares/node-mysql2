'use strict';

const SqlString = require('sqlstring');

const Connection = require('./lib/connection.js');
const ConnectionConfig = require('./lib/connection_config.js');
const parserCache = require('./lib/parsers/parser_cache');

exports.createConnection = function(opts) {
  return new Connection({ config: new ConnectionConfig(opts) });
};

exports.connect = exports.createConnection;
exports.Connection = Connection;

const Pool = require('./lib/pool.js');
const PoolCluster = require('./lib/pool_cluster.js');

exports.createPool = function(config) {
  const PoolConfig = require('./lib/pool_config.js');
  return new Pool({ config: new PoolConfig(config) });
};

exports.createPoolCluster = function(config) {
  const PoolCluster = require('./lib/pool_cluster.js');
  return new PoolCluster(config);
};

exports.createQuery = Connection.createQuery;

exports.Pool = Pool;

exports.PoolCluster = PoolCluster;

exports.createServer = function(handler) {
  const Server = require('./lib/server.js');
  const s = new Server();
  if (handler) {
    s.on('connection', handler);
  }
  return s;
};

exports.PoolConnection = require('./lib/pool_connection');
exports.escape = SqlString.escape;
exports.escapeId = SqlString.escapeId;
exports.format = SqlString.format;
exports.raw = SqlString.raw;

exports.__defineGetter__(
  'createConnectionPromise',
  () => require('./promise.js').createConnection
);

exports.__defineGetter__(
  'createPoolPromise',
  () => require('./promise.js').createPool
);

exports.__defineGetter__(
  'createPoolClusterPromise',
  () => require('./promise.js').createPoolCluster
);

exports.__defineGetter__('Types', () => require('./lib/constants/types.js'));

exports.__defineGetter__('Charsets', () =>
  require('./lib/constants/charsets.js')
);

exports.__defineGetter__('CharsetToEncoding', () =>
  require('./lib/constants/charset_encodings.js')
);

exports.setMaxParserCache = function(max) {
  parserCache.setMaxCache(max);
};

exports.clearParserCache = function() {
  parserCache.clearCache();
};
