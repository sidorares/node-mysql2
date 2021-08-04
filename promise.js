'use strict';

const core = require('./index.js');
const EventEmitter = require('events').EventEmitter;

function makeDoneCb(resolve, reject, localErr) {
  return function (err, rows, fields) {
    if (err) {
      localErr.message = err.message;
      localErr.code = err.code;
      localErr.errno = err.errno;
      localErr.sql = err.sql;
      localErr.sqlState = err.sqlState;
      localErr.sqlMessage = err.sqlMessage;
      reject(localErr);
    } else {
      resolve([rows, fields]);
    }
  };
}

function inheritEvents(source, target, events) {
  const listeners = {};
  target
    .on('newListener', eventName => {
      if (events.indexOf(eventName) >= 0 && !target.listenerCount(eventName)) {
        source.on(
          eventName,
          (listeners[eventName] = function () {
            const args = [].slice.call(arguments);
            args.unshift(eventName);

            target.emit.apply(target, args);
          })
        );
      }
    })
    .on('removeListener', eventName => {
      if (events.indexOf(eventName) >= 0 && !target.listenerCount(eventName)) {
        source.removeListener(eventName, listeners[eventName]);
        delete listeners[eventName];
      }
    });
}

class PromisePreparedStatementInfo {
  constructor(statement, promiseImpl) {
    this.statement = statement;
    this.Promise = promiseImpl;
  }

  execute(parameters) {
    const s = this.statement;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      if (parameters) {
        s.execute(parameters, done);
      } else {
        s.execute(done);
      }
    });
  }

  close() {
    return new this.Promise(resolve => {
      this.statement.close();
      resolve();
    });
  }
}

class PromiseConnection extends EventEmitter {
  constructor(connection, promiseImpl) {
    super();
    this.connection = connection;
    this.Promise = promiseImpl || Promise;
    inheritEvents(connection, this, [
      'error',
      'drain',
      'connect',
      'end',
      'enqueue'
    ]);
  }

  release() {
    this.connection.release();
  }

  query(query, params) {
    const c = this.connection;
    const localErr = new Error();
    if (typeof params === 'function') {
      throw new Error(
        'Callback function is not available with promise clients.'
      );
    }
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      if (params !== undefined) {
        c.query(query, params, done);
      } else {
        c.query(query, done);
      }
    });
  }

  execute(query, params) {
    const c = this.connection;
    const localErr = new Error();
    if (typeof params === 'function') {
      throw new Error(
        'Callback function is not available with promise clients.'
      );
    }
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      if (params !== undefined) {
        c.execute(query, params, done);
      } else {
        c.execute(query, done);
      }
    });
  }

  end() {
    return new this.Promise(resolve => {
      this.connection.end(resolve);
    });
  }

  beginTransaction() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      c.beginTransaction(done);
    });
  }

  commit() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      c.commit(done);
    });
  }

  rollback() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      c.rollback(done);
    });
  }

  ping() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      c.ping(done);
    });
  }

  connect() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      c.connect((err, param) => {
        if (err) {
          localErr.message = err.message;
          localErr.code = err.code;
          localErr.errno = err.errno;
          localErr.sqlState = err.sqlState;
          localErr.sqlMessage = err.sqlMessage;
          reject(localErr);
        } else {
          resolve(param);
        }
      });
    });
  }

  prepare(options) {
    const c = this.connection;
    const promiseImpl = this.Promise;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      c.prepare(options, (err, statement) => {
        if (err) {
          localErr.message = err.message;
          localErr.code = err.code;
          localErr.errno = err.errno;
          localErr.sqlState = err.sqlState;
          localErr.sqlMessage = err.sqlMessage;
          reject(localErr);
        } else {
          const wrappedStatement = new PromisePreparedStatementInfo(
            statement,
            promiseImpl
          );
          resolve(wrappedStatement);
        }
      });
    });
  }

  changeUser(options) {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      c.changeUser(options, err => {
        if (err) {
          localErr.message = err.message;
          localErr.code = err.code;
          localErr.errno = err.errno;
          localErr.sqlState = err.sqlState;
          localErr.sqlMessage = err.sqlMessage;
          reject(localErr);
        } else {
          resolve();
        }
      });
    });
  }

  get config() {
    return this.connection.config;
  }

  get threadId() {
    return this.connection.threadId;
  }
}

function createConnection(opts) {
  const coreConnection = core.createConnection(opts);
  const createConnectionErr = new Error();
  const thePromise = opts.Promise || Promise;
  if (!thePromise) {
    throw new Error(
      'no Promise implementation available.' +
      'Use promise-enabled node version or pass userland Promise' +
      " implementation as parameter, for example: { Promise: require('bluebird') }"
    );
  }
  return new thePromise((resolve, reject) => {
    coreConnection.once('connect', () => {
      resolve(new PromiseConnection(coreConnection, thePromise));
    });
    coreConnection.once('error', err => {
      createConnectionErr.message = err.message;
      createConnectionErr.code = err.code;
      createConnectionErr.errno = err.errno;
      createConnectionErr.sqlState = err.sqlState;
      reject(createConnectionErr);
    });
  });
}

// note: the callback of "changeUser" is not called on success
// hence there is no possibility to call "resolve"

// patching PromiseConnection
// create facade functions for prototype functions on "Connection" that are not yet
// implemented with PromiseConnection

// proxy synchronous functions only
(function (functionsToWrap) {
  for (let i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
    const func = functionsToWrap[i];

    if (
      typeof core.Connection.prototype[func] === 'function' &&
      PromiseConnection.prototype[func] === undefined
    ) {
      PromiseConnection.prototype[func] = (function factory(funcName) {
        return function () {
          return core.Connection.prototype[funcName].apply(
            this.connection,
            arguments
          );
        };
      })(func);
    }
  }
})([
  // synchronous functions
  'close',
  'createBinlogStream',
  'destroy',
  'escape',
  'escapeId',
  'format',
  'pause',
  'pipe',
  'resume',
  'unprepare'
]);

class PromisePoolConnection extends PromiseConnection {
  constructor(connection, promiseImpl) {
    super(connection, promiseImpl);
  }

  destroy() {
    return core.PoolConnection.prototype.destroy.apply(
      this.connection,
      arguments
    );
  }
}

class PromisePool extends EventEmitter {
  constructor(pool, thePromise) {
    super();
    this.pool = pool;
    this.Promise = thePromise || Promise;
    inheritEvents(pool, this, ['acquire', 'connection', 'enqueue', 'release']);
  }

  getConnection() {
    const corePool = this.pool;
    return new this.Promise((resolve, reject) => {
      corePool.getConnection((err, coreConnection) => {
        if (err) {
          reject(err);
        } else {
          resolve(new PromisePoolConnection(coreConnection, this.Promise));
        }
      });
    });
  }

  query(sql, args) {
    const corePool = this.pool;
    const localErr = new Error();
    if (typeof args === 'function') {
      throw new Error(
        'Callback function is not available with promise clients.'
      );
    }
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      if (args !== undefined) {
        corePool.query(sql, args, done);
      } else {
        corePool.query(sql, done);
      }
    });
  }

  execute(sql, args) {
    const corePool = this.pool;
    const localErr = new Error();
    if (typeof args === 'function') {
      throw new Error(
        'Callback function is not available with promise clients.'
      );
    }
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      if (args) {
        corePool.execute(sql, args, done);
      } else {
        corePool.execute(sql, done);
      }
    });
  }

  end() {
    const corePool = this.pool;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      corePool.end(err => {
        if (err) {
          localErr.message = err.message;
          localErr.code = err.code;
          localErr.errno = err.errno;
          localErr.sqlState = err.sqlState;
          localErr.sqlMessage = err.sqlMessage;
          reject(localErr);
        } else {
          resolve();
        }
      });
    });
  }
}

function createPool(opts) {
  const corePool = core.createPool(opts);
  const thePromise = opts.Promise || Promise;
  if (!thePromise) {
    throw new Error(
      'no Promise implementation available.' +
      'Use promise-enabled node version or pass userland Promise' +
      " implementation as parameter, for example: { Promise: require('bluebird') }"
    );
  }

  return new PromisePool(corePool, thePromise);
}

(function (functionsToWrap) {
  for (let i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
    const func = functionsToWrap[i];

    if (
      typeof core.Pool.prototype[func] === 'function' &&
      PromisePool.prototype[func] === undefined
    ) {
      PromisePool.prototype[func] = (function factory(funcName) {
        return function () {
          return core.Pool.prototype[funcName].apply(this.pool, arguments);
        };
      })(func);
    }
  }
})([
  // synchronous functions
  'escape',
  'escapeId',
  'format'
]);

class PromisePoolCluster extends EventEmitter {
  constructor(poolCluster, thePromise) {
    super();
    this.poolCluster = poolCluster;
    this.Promise = thePromise || Promise;
    inheritEvents(poolCluster, this, ['acquire', 'connection', 'enqueue', 'release']);
  }

  getConnection() {
    const corePoolCluster = this.poolCluster;
    return new this.Promise((resolve, reject) => {
      corePoolCluster.getConnection((err, coreConnection) => {
        if (err) {
          reject(err);
        } else {
          resolve(new PromisePoolConnection(coreConnection, this.Promise));
        }
      });
    });
  }

  query(sql, args) {
    const corePoolCluster = this.poolCluster;
    const localErr = new Error();
    if (typeof args === 'function') {
      throw new Error(
        'Callback function is not available with promise clients.'
      );
    }
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      corePoolCluster.query(sql, args, done);
    });
  }

  execute(sql, args) {
    const corePoolCluster = this.poolCluster;
    const localErr = new Error();
    if (typeof args === 'function') {
      throw new Error(
        'Callback function is not available with promise clients.'
      );
    }
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, localErr);
      corePoolCluster.execute(sql, args, done);
    });
  }

  of(pattern, selector) {
    return new PromisePoolCluster(
      this.poolCluster.of(pattern, selector),
      this.Promise
    );
  }

  end() {
    const corePoolCluster = this.poolCluster;
    const localErr = new Error();
    return new this.Promise((resolve, reject) => {
      corePoolCluster.end(err => {
        if (err) {
          localErr.message = err.message;
          localErr.code = err.code;
          localErr.errno = err.errno;
          localErr.sqlState = err.sqlState;
          localErr.sqlMessage = err.sqlMessage;
          reject(localErr);
        } else {
          resolve();
        }
      });
    });
  }
}

/**
 * proxy poolCluster synchronous functions
 */
(function (functionsToWrap) {
  for (let i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
    const func = functionsToWrap[i];

    if (
      typeof core.PoolCluster.prototype[func] === 'function' &&
      PromisePoolCluster.prototype[func] === undefined
    ) {
      PromisePoolCluster.prototype[func] = (function factory(funcName) {
        return function () {
          return core.PoolCluster.prototype[funcName].apply(this.poolCluster, arguments);
        };
      })(func);
    }
  }
})([
  'add'
]);

function createPoolCluster(opts) {
  const corePoolCluster = core.createPoolCluster(opts);
  const thePromise = (opts && opts.Promise) || Promise;
  if (!thePromise) {
    throw new Error(
      'no Promise implementation available.' +
      'Use promise-enabled node version or pass userland Promise' +
      " implementation as parameter, for example: { Promise: require('bluebird') }"
    );
  }
  return new PromisePoolCluster(corePoolCluster, thePromise);
}

exports.createConnection = createConnection;
exports.createPool = createPool;
exports.createPoolCluster = createPoolCluster;
exports.escape = core.escape;
exports.escapeId = core.escapeId;
exports.format = core.format;
exports.raw = core.raw;
exports.PromisePool = PromisePool;
exports.PromiseConnection = PromiseConnection;
exports.PromisePoolConnection = PromisePoolConnection;
