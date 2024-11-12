'use strict';

const PromiseConnection = require('./promise_connection.js');
const BasePoolConnection = require('./base_pool_connection.js');

class PromisePoolConnection extends PromiseConnection {
  constructor(connection, promiseImpl) {
    super(connection, promiseImpl);
  }

  destroy() {
    return BasePoolConnection.prototype.destroy.apply(
      this.connection,
      arguments,
    );
  }
}

module.exports = PromisePoolConnection;
