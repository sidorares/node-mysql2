var ConnectionConfig = require('./connection_config.js');

module.exports = PoolConfig;
function PoolConfig(options) {
  if (typeof options === 'string') {
    options = ConnectionConfig.parseUrl(options);
  }
  this.connectionConfig = new ConnectionConfig(options);
  this.waitForConnections = options.waitForConnections == null
    ? true
    : Boolean(options.waitForConnections);
  this.connectionLimit = options.connectionLimit == null
    ? 10
    : Number(options.connectionLimit) || 10;
  this.queueLimit = options.queueLimit == null
    ? 0
    : Number(options.queueLimit) || 0;
  this.minConnections = Math.min(
    this.connectionLimit,
    Number(options.minConnections) || 0
  );
  this.autoOpenConnections = options.autoOpenConnections == null
    ? true
    : Boolean(options.autoOpenConnections);
  this.idleTimeout = options.idleTimeout == null
    ? 300
    : Number(options.idleTimeout) || 300;
}
