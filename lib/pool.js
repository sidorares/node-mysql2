'use strict';

const BasePool = require('./base_pool.js');

class Pool extends BasePool {
  promise(promiseImpl) {
    const PromisePool = require('./promise_pool.js');
    return new PromisePool(this, promiseImpl);
  }
}

module.exports = Pool;
