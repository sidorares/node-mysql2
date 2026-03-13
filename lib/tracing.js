'use strict';

const process = require('process');

// Safe load: use getBuiltinModule if available, fallback to require, catch if unavailable
const dc = (() => {
  try {
    return 'getBuiltinModule' in process
      ? process.getBuiltinModule('node:diagnostics_channel')
      : require('node:diagnostics_channel');
  } catch {
    return undefined;
  }
})();

const hasTracingChannel = typeof dc?.tracingChannel === 'function';

const queryChannel = hasTracingChannel
  ? dc.tracingChannel('mysql2:query')
  : undefined;

const executeChannel = hasTracingChannel
  ? dc.tracingChannel('mysql2:execute')
  : undefined;

const connectChannel = hasTracingChannel
  ? dc.tracingChannel('mysql2:connect')
  : undefined;

const poolConnectChannel = hasTracingChannel
  ? dc.tracingChannel('mysql2:pool:connect')
  : undefined;

function getServerContext(config) {
  if (config.socketPath) {
    return { serverAddress: config.socketPath, serverPort: undefined };
  }
  return {
    serverAddress: config.host || 'localhost',
    serverPort: config.port || 3306,
  };
}

function traceQuery(fn, contextFactory) {
  if (queryChannel?.hasSubscribers) {
    return queryChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

function traceExecute(fn, contextFactory) {
  if (executeChannel?.hasSubscribers) {
    return executeChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

function traceConnect(fn, contextFactory) {
  if (connectChannel?.hasSubscribers) {
    return connectChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

function tracePoolConnect(fn, contextFactory) {
  if (poolConnectChannel?.hasSubscribers) {
    return poolConnectChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

module.exports = {
  queryChannel,
  executeChannel,
  connectChannel,
  poolConnectChannel,
  getServerContext,
  traceQuery,
  traceExecute,
  traceConnect,
  tracePoolConnect,
};
