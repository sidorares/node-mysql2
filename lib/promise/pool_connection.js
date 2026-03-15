'use strict';

const PromiseConnection = require('./connection.js');

class PromisePoolConnection extends PromiseConnection {
  constructor(connection, promiseImpl) {
    super(connection, promiseImpl);
  }

  destroy() {
    return this.connection.destroy();
  }

  async [Symbol.asyncDispose]() {
    this.release();
  }
}

module.exports = PromisePoolConnection;
