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

// Only skip tracing when hasSubscribers is explicitly false.
// On Node 18.x hasSubscribers is undefined (getter not on TracingChannel),
// so we trace unconditionally — only Node 20+ can zero-cost optimize.
function traceQuery(fn, contextFactory) {
  if (queryChannel && queryChannel.hasSubscribers !== false) {
    return queryChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

function traceExecute(fn, contextFactory) {
  if (executeChannel && executeChannel.hasSubscribers !== false) {
    return executeChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

function traceConnect(fn, contextFactory) {
  if (connectChannel && connectChannel.hasSubscribers !== false) {
    return connectChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

function tracePoolConnect(fn, contextFactory) {
  if (poolConnectChannel && poolConnectChannel.hasSubscribers !== false) {
    return poolConnectChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

module.exports = {
  dc,
  hasTracingChannel,
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
