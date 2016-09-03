var SqlString = require('sqlstring');

var Connection = require('./lib/connection.js');
var ConnectionConfig = require('./lib/connection_config.js');

module.exports.createConnection = function (opts) {
  return new Connection({config: new ConnectionConfig(opts)});
};

module.exports.connect = module.exports.createConnection;
module.exports.Connection = Connection;

module.exports.createPool = function (config) {
  var PoolConfig = require('./lib/pool_config.js');
  var Pool = require('./lib/pool.js');
  return new Pool({config: new PoolConfig(config)});
};

exports.createPoolCluster = function (config) {
  var PoolCluster = require('./lib/pool_cluster.js');
  return new PoolCluster(config);
};

module.exports.createServer = function (handler) {
  var Server = require('./lib/server.js');
  var s = new Server();
  if (handler) {
    s.on('connection', handler);
  }
  return s;
};

exports.escape = SqlString.escape;
exports.escapeId = SqlString.escapeId;
exports.format = SqlString.format;

exports.__defineGetter__('createConnectionPromise', function () {
  return require('./promise.js').createConnection;
});

exports.__defineGetter__('createPoolPromise', function () {
  return require('./promise.js').createPool;
});

exports.__defineGetter__('createPoolClusterPromise', function () {
  return require('./promise.js').createPoolCluster;
});

exports.__defineGetter__('Types', function () {
  return require('./lib/constants/types.js');
});

exports.__defineGetter__('Charsets', function () {
  return require('./lib/constants/charsets.js');
});

exports.__defineGetter__('CharsetToEncoding', function () {
  return require('./lib/constants/charset_encodings.js');
});
