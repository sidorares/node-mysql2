var ConnectionConfig = require('./connection_config.js');

module.exports = PoolConfig;
function PoolConfig(options) {
  if (typeof options === 'string') {
    options = ConnectionConfig.parseUrl(options);
  }
  this.connectionConfig = new ConnectionConfig(options);
  this.waitForConnections = options.waitForConnections === undefined
    ? true
    : Boolean(options.waitForConnections);
  this.connectionLimit = options.connectionLimit === undefined
    ? 10
    : Number(options.connectionLimit);
  this.queueLimit = options.queueLimit === undefined
    ? 0
    : Number(options.queueLimit);
}
