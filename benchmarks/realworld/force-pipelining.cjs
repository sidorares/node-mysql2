'use strict';

// Preload for docker-test-suite.sh: makes every connection that does not set
// `pipelining` use a depth of 32, so the whole test suite exercises it.
const path = require('node:path');

const ConnectionConfig = require(
  path.join(__dirname, '../../lib/connection_config.js')
);

const withPipelining = (options) => ({
  ...(options || {}),
  pipelining:
    options && options.pipelining !== undefined ? options.pipelining : 32,
});

const depth = ConnectionConfig.pipeliningDepth;
ConnectionConfig.pipeliningDepth = (options, flags) =>
  depth(withPipelining(options), flags);

const defaultFlags = ConnectionConfig.getDefaultFlags;
ConnectionConfig.getDefaultFlags = (options) =>
  defaultFlags(withPipelining(options));
