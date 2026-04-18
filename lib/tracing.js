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

// Node 20+: TracingChannel has an aggregated hasSubscribers getter.
// Node 18.x: that getter is missing (undefined), fall back to start sub-channel.
function shouldTrace(channel) {
  if (channel === undefined || channel === null) {
    return false;
  }
  return channel.hasSubscribers ?? channel.start?.hasSubscribers ?? false;
}

// Generic traceCallback wrapper — calls fn synchronously, wraps the callback
// at args[position] to emit asyncStart/asyncEnd/error. No promises involved.
function traceCallback(channel, fn, position, context, thisArg, ...args) {
  if (shouldTrace(channel)) {
    return channel.traceCallback(fn, position, context(), thisArg, ...args);
  }
  return fn.apply(thisArg, args);
}

// tracePromise for operations that are inherently async (connection handshake)
function tracePromise(channel, fn, contextFactory) {
  if (shouldTrace(channel)) {
    return channel.tracePromise(fn, contextFactory());
  }
  return fn();
}

module.exports = {
  dc,
  hasTracingChannel,
  shouldTrace,
  queryChannel,
  executeChannel,
  connectChannel,
  poolConnectChannel,
  getServerContext,
  traceCallback,
  tracePromise,
};
