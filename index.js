'use strict';

const SqlString = require('sql-escaper');

const ConnectionConfig = require('./lib/connection_config.js');
const parserCache = require('./lib/parsers/parser_cache.js');

const Connection = require('./lib/connection.js');

exports.createConnection = require('./lib/create_connection.js');
exports.connect = exports.createConnection;
exports.Connection = Connection;
exports.ConnectionConfig = ConnectionConfig;

const Pool = require('./lib/pool.js');
const PoolCluster = require('./lib/pool_cluster.js');
const createPool = require('./lib/create_pool.js');
const createPoolCluster = require('./lib/create_pool_cluster.js');

exports.createPool = createPool;

exports.createPoolCluster = createPoolCluster;

exports.createQuery = Connection.createQuery;

exports.Pool = Pool;

exports.PoolCluster = PoolCluster;

const _serverHandlerKeys = ['query', 'ping', 'quit', 'init_db', 'auth'];

function _hasHandlerKeys(obj) {
  return _serverHandlerKeys.some((k) => typeof obj[k] === 'function');
}

function _wrapAuth(authHandler) {
  return function (params, cb) {
    Promise.resolve()
      .then(() => authHandler(params))
      .then(() => cb(null))
      .catch((err) =>
        cb(null, { message: err.message, code: err.code || 1045 })
      );
  };
}

function _buildHandshakeArgs(handlers) {
  const args = {
    protocolVersion: 10,
    serverVersion: handlers.serverVersion || 'mysql2-server',
    connectionId: Math.floor(Math.random() * 1000000),
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff,
  };
  if (handlers.auth) {
    args.authCallback = _wrapAuth(handlers.auth);
  }
  return args;
}

exports.createServer = function (opts = {}) {
  const Server = require('./lib/server.js');
  const Commands = require('./lib/commands/index.js');
  const { buildHandleCommand } = require('./lib/commands/server/index.js');

  if (typeof opts === 'function') {
    const fn = opts;
    const s = new Server({ encoding: 'cesu8' });
    s.on('connection', (conn) => {
      conn.on('error', () => {});
      const result = fn(conn);
      if (!result || typeof result !== 'object' || !_hasHandlerKeys(result)) {
        return;
      }
      const handlers = result;
      const encoding = handlers.encoding || 'cesu8';
      conn.serverConfig = { encoding };
      conn.config.serverOptions = Object.assign({}, conn.config.serverOptions, {
        handleCommand: buildHandleCommand(handlers),
        encoding,
      });
      conn.addCommand(
        new Commands.ServerHandshake(_buildHandshakeArgs(handlers))
      );
    });
    return s;
  }

  if (_hasHandlerKeys(opts)) {
    const handleCommand = buildHandleCommand(opts);
    const encoding = opts.encoding || 'cesu8';
    const s = new Server({ handleCommand, encoding });
    s.on('connection', (conn) => {
      conn.on('error', () => {});
      conn.serverConfig = { encoding };
      conn.addCommand(new Commands.ServerHandshake(_buildHandshakeArgs(opts)));
    });
    return s;
  }

  const s = new Server({
    handleCommand: opts.handleCommand,
    encoding: opts.encoding || 'cesu8',
  });
  if (opts.onConnection) {
    s.on('connection', opts.onConnection);
  }
  return s;
};

exports.PoolConnection = require('./lib/pool_connection.js');
exports.authPlugins = require('./lib/auth_plugins');
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

exports.setMaxParserCache = function (max) {
  parserCache.setMaxCache(max);
};

exports.clearParserCache = function () {
  parserCache.clearCache();
};
