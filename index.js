'use strict';

// Import required modules
const SqlString = require('sqlstring');
const Connection = require('./lib/connection.js');
const ConnectionConfig = require('./lib/connection_config.js');
const parserCache = require('./lib/parsers/parser_cache');
const Pool = require('./lib/pool.js');
const PoolCluster = require('./lib/pool_cluster.js');

// Exports functions for creating database connections, pools, and servers
exports.createConnection = function(opts) {
  // Create a new database connection using the provided options
  return new Connection({ config: new ConnectionConfig(opts) });
};

// Alias for createConnection function
exports.connect = exports.createConnection;

// Expose Connection and ConnectionConfig classes
exports.Connection = Connection;
exports.ConnectionConfig = ConnectionConfig;

// Exports functions for creating database pools and pool clusters
exports.createPool = function(config) {
  // Create a new database pool using the provided configuration
  const PoolConfig = require('./lib/pool_config.js');
  return new Pool({ config: new PoolConfig(config) });
};

exports.createPoolCluster = function(config) {
  // Create a new database pool cluster using the provided configuration
  return new PoolCluster(config);
};

// Expose createQuery function from Connection class
exports.createQuery = Connection.createQuery;

// Expose Pool and PoolCluster classes
exports.Pool = Pool;
exports.PoolCluster = PoolCluster;

// Exports function for creating a server with optional connection handler
exports.createServer = function(handler) {
  const Server = require('./lib/server.js');
  const s = new Server();
  if (handler) {
    s.on('connection', handler);
  }
  return s;
};

// Expose PoolConnection and authPlugins modules
exports.PoolConnection = require('./lib/pool_connection');
exports.authPlugins = require('./lib/auth_plugins');

// Expose escape, escapeId, format, and raw functions from SqlString module
exports.escape = SqlString.escape;
exports.escapeId = SqlString.escapeId;
exports.format = SqlString.format;
exports.raw = SqlString.raw;

// Define getters for Promise-based connection functions, Types, Charsets, and CharsetToEncoding
exports.__defineGetter__('createConnectionPromise', () => require('./promise.js').createConnection);
exports.__defineGetter__('createPoolPromise', () => require('./promise.js').createPool);
exports.__defineGetter__('createPoolClusterPromise', () => require('./promise.js').createPoolCluster);
exports.__defineGetter__('Types', () => require('./lib/constants/types.js'));
exports.__defineGetter__('Charsets', () => require('./lib/constants/charsets.js'));
exports.__defineGetter__('CharsetToEncoding', () => require('./lib/constants/charset_encodings.js'));

// Expose functions for setting and clearing parser cache
exports.setMaxParserCache = function(max) {
  parserCache.setMaxCache(max);
};

exports.clearParserCache = function() {
  parserCache.clearCache();
};
