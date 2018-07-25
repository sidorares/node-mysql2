var core = require('./index.js');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function inheritEvents(source, target, events) {
  var listeners = {};
  target
    .on('newListener', function(eventName) {
      if (events.indexOf(eventName) >= 0 && !target.listenerCount(eventName)) {
        source.on(
          eventName,
          (listeners[eventName] = function() {
            var args = [].slice.call(arguments);
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
    coreConnection.once('connect', function(connectParams) {
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

function PromiseConnection(connection, promiseImpl) {
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
util.inherits(PromiseConnection, EventEmitter);

PromiseConnection.prototype.release = function() {
  this.connection.release();
};

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

PromiseConnection.prototype.query = function(query, params) {
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
};

PromiseConnection.prototype.execute = function(query, params) {
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
};

PromiseConnection.prototype.end = function() {
  const c = this.connection;
  return new this.Promise(function(resolve, reject) {
    c.end(function() {
      resolve();
    });
  });
};

PromiseConnection.prototype.beginTransaction = function() {
  const c = this.connection;
  const localErr = new Error();
  return new this.Promise(function(resolve, reject) {
    const done = makeDoneCb(resolve, reject, localErr);
    c.beginTransaction(done);
  });
};

PromiseConnection.prototype.commit = function() {
  const c = this.connection;
  const localErr = new Error();
  return new this.Promise(function(resolve, reject) {
    const done = makeDoneCb(resolve, reject, localErr);
    c.commit(done);
  });
};

PromiseConnection.prototype.rollback = function() {
  const c = this.connection;
  const localErr = new Error();
  return new this.Promise(function(resolve, reject) {
    const done = makeDoneCb(resolve, reject, localErr);
    c.rollback(done);
  });
};

PromiseConnection.prototype.ping = function() {
  const c = this.connection;
  const localErr = new Error();
  return new this.Promise(function(resolve, reject) {
    const done = makeDoneCb(resolve, reject, localErr);
    c.ping(done);
  });
};

PromiseConnection.prototype.connect = function() {
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
};

PromiseConnection.prototype.prepare = function(options) {
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
};

PromiseConnection.prototype.changeUser = function(options) {
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
};

function PromisePreparedStatementInfo(statement, promiseImpl) {
  this.statement = statement;
  this.Promise = promiseImpl;
}

PromisePreparedStatementInfo.prototype.execute = function(parameters) {
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
};

PromisePreparedStatementInfo.prototype.close = function() {
  const s = this.statement;
  return new this.Promise(function(resolve, reject) {
    s.close();
    resolve();
  });
};

// note: the callback of "changeUser" is not called on success
// hence there is no possibility to call "resolve"

// patching PromiseConnection
// create facade functions for prototype functions on "Connection" that are not yet
// implemented with PromiseConnection

// proxy synchronous functions only
(function(functionsToWrap) {
  for (var i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
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

(function(functionsToWrap) {
  for (var i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
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

function PromisePoolConnection() {
  PromiseConnection.apply(this, arguments);
}

util.inherits(PromisePoolConnection, PromiseConnection);

PromisePoolConnection.prototype.destroy = function() {
  return core.PoolConnection.prototype.destroy.apply(
    this.connection,
    arguments
  );
};

function PromisePool(pool, Promise) {
  this.pool = pool;
  this.Promise = Promise || global.Promise;

  inheritEvents(pool, this, ['acquire', 'connection', 'enqueue', 'release']);
}
util.inherits(PromisePool, EventEmitter);

PromisePool.prototype.getConnection = function() {
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
};

PromisePool.prototype.query = function(sql, args) {
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
};

PromisePool.prototype.execute = function(sql, values) {
  const corePool = this.pool;
  const localErr = new Error();

  return new this.Promise(function(resolve, reject) {
    corePool.execute(sql, values, makeDoneCb(resolve, reject, localErr));
  });
};

PromisePool.prototype.end = function() {
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
};

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

module.exports.createConnection = createConnection;
module.exports.createPool = createPool;
module.exports.escape = core.escape;
module.exports.escapeId = core.escapeId;
module.exports.format = core.format;
module.exports.raw = core.raw;
module.exports.PromisePool = PromisePool;
module.exports.PromiseConnection = PromiseConnection;
module.exports.PromisePoolConnection = PromisePoolConnection;
