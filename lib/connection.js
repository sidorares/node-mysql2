'use strict';

const BaseConnection = require('./base_connection.js');

class Connection extends BaseConnection {
  promise(promiseImpl) {
    const PromiseConnection = require('./promise_connection.js');
    return new PromiseConnection(this, promiseImpl);
  }
}

module.exports = Connection;
