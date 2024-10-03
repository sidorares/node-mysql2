'use strict';

const PromiseConnection = require('./promise_connection.js');
const PoolConnection = require('./pool_connection.js');

class PromisePoolConnection extends PromiseConnection {
  constructor(connection, promiseImpl) {
    super(connection, promiseImpl);
  }

  destroy() {
    return PoolConnection.prototype.destroy.apply(
      this.connection,
      arguments
    );
  }
}

module.exports = PromisePoolConnection
