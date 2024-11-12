'use strict';

const BasePoolConnection = require('./base_pool_connection.js');

class PoolConnection extends BasePoolConnection {
  promise(promiseImpl) {
    const PromisePoolConnection = require('./promise_pool_connection.js');
    return new PromisePoolConnection(this, promiseImpl);
  }
}

module.exports = PoolConnection;
