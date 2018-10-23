'use strict';

const core = require('./index.js');
const { EventEmitter } = require('events');

function makeDoneCb(resolve, reject, localErr) {
  return function(err, rows, fields) {
    if (err) {
      localErr.message = err.message;
      localErr.code = err.code;
      localErr.errno = err.errno;
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
    .on('newListener', function(eventName) {
      if (events.indexOf(eventName) >= 0 && !target.listenerCount(eventName)) {
        source.on(
          eventName,
          (listeners[eventName] = function() {
            const args = [].slice.call(arguments);
            args.unshift(eventName);

            target.emit.apply(target, args);
          })
        );
      }
    })
    .on('removeListener', function(eventName) {
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
    return new this.Promise(function(resolve, reject) {
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
    this.Promise = promiseImpl || global.Promise;
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
    return new this.Promise(function(resolve, reject) {
      const done = makeDoneCb(resolve, reject, localErr);
      if (params) {
        c.query(query, params, done);
      } else {
        c.query(query, done);
      }
    });
  }

  execute(query, params) {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise(function(resolve, reject) {
      const done = makeDoneCb(resolve, reject, localErr);
      if (params) {
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
    return new this.Promise(function(resolve, reject) {
      const done = makeDoneCb(resolve, reject, localErr);
      c.beginTransaction(done);
    });
  }

  commit() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise(function(resolve, reject) {
      const done = makeDoneCb(resolve, reject, localErr);
      c.commit(done);
    });
  }

  rollback() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise(function(resolve, reject) {
      const done = makeDoneCb(resolve, reject, localErr);
      c.rollback(done);
    });
  }

  ping() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise(function(resolve, reject) {
      const done = makeDoneCb(resolve, reject, localErr);
      c.ping(done);
    });
  }

  connect() {
    const c = this.connection;
    const localErr = new Error();
    return new this.Promise(function(resolve, reject) {
      c.connect(function(err, param) {
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
    return new this.Promise(function(resolve, reject) {
      c.prepare(options, function(err, statement) {
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
    return new this.Promise(function(resolve, reject) {
      c.changeUser(options, function(err) {
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

function createConnection(opts) {
  const coreConnection = core.createConnection(opts);
  const createConnectionErr = new Error();
  const Promise = opts.Promise || global.Promise;
  if (!Promise) {
    throw new Error(
      'no Promise implementation available.' +
        'Use promise-enabled node version or pass userland Promise' +
        " implementation as parameter, for example: { Promise: require('bluebird') }"
    );
  }
  return new Promise(function(resolve, reject) {
    coreConnection.once('connect', function() {
      resolve(new PromiseConnection(coreConnection, Promise));
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
(function(functionsToWrap) {
  for (let i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
    const func = functionsToWrap[i];

    if (
      typeof core.Connection.prototype[func] === 'function' &&
      PromiseConnection.prototype[func] === undefined
    ) {
      PromiseConnection.prototype[func] = (function factory(funcName) {
        return function() {
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
  constructor(pool, Promise) {
    super();
    this.pool = pool;
    this.Promise = Promise || global.Promise;
    inheritEvents(pool, this, ['acquire', 'connection', 'enqueue', 'release']);
  }

  getConnection() {
    const self = this;
    const corePool = this.pool;
    return new this.Promise(function(resolve, reject) {
      corePool.getConnection(function(err, coreConnection) {
        if (err) {
          reject(err);
        } else {
          resolve(new PromisePoolConnection(coreConnection, self.Promise));
        }
      });
    });
  }

  query(sql, args) {
    const corePool = this.pool;
    const localErr = new Error();
    return new this.Promise(function(resolve, reject) {
      const done = makeDoneCb(resolve, reject, localErr);
      if (args) {
        corePool.query(sql, args, done);
      } else {
        corePool.query(sql, done);
      }
    });
  }

  execute(sql, values) {
    const corePool = this.pool;
    const localErr = new Error();
    return new this.Promise(function(resolve, reject) {
      corePool.execute(sql, values, makeDoneCb(resolve, reject, localErr));
    });
  }

  end() {
    const corePool = this.pool;
    const localErr = new Error();
    return new this.Promise(function(resolve, reject) {
      corePool.end(function(err) {
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
  const Promise = opts.Promise || global.Promise;
  if (!Promise) {
    throw new Error(
      'no Promise implementation available.' +
        'Use promise-enabled node version or pass userland Promise' +
        " implementation as parameter, for example: { Promise: require('bluebird') }"
    );
  }

  return new PromisePool(corePool, Promise);
}

(function(functionsToWrap) {
  for (let i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
    const func = functionsToWrap[i];

    if (
      typeof core.Pool.prototype[func] === 'function' &&
      PromisePool.prototype[func] === undefined
    ) {
      PromisePool.prototype[func] = (function factory(funcName) {
        return function() {
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

module.exports.createConnection = createConnection;
module.exports.createPool = createPool;
module.exports.escape = core.escape;
module.exports.escapeId = core.escapeId;
module.exports.format = core.format;
module.exports.raw = core.raw;
module.exports.PromisePool = PromisePool;
module.exports.PromiseConnection = PromiseConnection;
module.exports.PromisePoolConnection = PromisePoolConnection;
