var core = require('./index.js');

function createConnection (opts) {
  var coreConnection = core.createConnection(opts);
  var Promise = opts.Promise || global.Promise;
  if (!Promise) {
    throw new Error('no Promise implementation available.' +
      'Use promise-enabled node version or pass userland Promise' +
      ' implementation as parameter, for example: { Promise: require(\'bluebird\') }');
  }
  return new Promise(function (resolve, reject) {
    coreConnection.once('connect', function (connectParams) {
      resolve(new PromiseConnection(coreConnection, Promise));
    });
    coreConnection.once('error', reject);
  });
}

function PromiseConnection (connection, promiseImpl) {
  this.connection = connection;
  this.Promise = promiseImpl;
}

PromiseConnection.prototype.release = function () {
  this.connection.release();
};

function makeDoneCb (resolve, reject) {
  return function (err, rows, fields) {
    if (err) {
      reject(err);
    } else {
      resolve([rows, fields]);
    }
  };
}

PromiseConnection.prototype.query = function (query, params) {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    var done = makeDoneCb(resolve, reject);
    if (params) {
      c.query(query, params, done);
    } else {
      c.query(query, done);
    }
  });
};

PromiseConnection.prototype.execute = function (query, params) {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    var done = makeDoneCb(resolve, reject);
    if (params) {
      c.execute(query, params, done);
    } else {
      c.execute(query, done);
    }
  });
};

PromiseConnection.prototype.end = function () {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    c.end(function () {
      resolve();
    });
  });
};

PromiseConnection.prototype.beginTransaction = function () {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    var done = makeDoneCb(resolve, reject);
    c.beginTransaction(done);
  });
};

PromiseConnection.prototype.commit = function () {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    var done = makeDoneCb(resolve, reject);
    c.commit(done);
  });
};

PromiseConnection.prototype.rollback = function () {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    var done = makeDoneCb(resolve, reject);
    c.rollback(done);
  });
};

PromiseConnection.prototype.ping = function () {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    c.ping(resolve);
  });
};

PromiseConnection.prototype.connect = function () {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    c.connect(function (error, param) {
      if (error) {
        reject(error);
      } else {
        resolve(param);
      }
    });
  });
};

PromiseConnection.prototype.prepare = function () {
  var c = this.connection;
  return new this.Promise(function (resolve, reject) {
    c.prepare(function (error, statement) {
      if (error) {
        reject(error);
      } else {
        resolve(statement);
      }
    });
  });
};

// note: the callback of "changeUser" is not called on success
// hence there is no possibility to call "resolve"

// patching PromiseConnection
// create facade functions for prototype functions on "Connection" that are not yet
// implemented with PromiseConnection

// proxy synchronous functions only
(function (functionsToWrap) {

  for (var i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
    var func = functionsToWrap[i];

    if (
      typeof core.Connection.prototype[func] === 'function'
      && PromiseConnection.prototype[func] === undefined
    ) {
      PromiseConnection.prototype[func] = (function factory (funcName) {
        return function () {
          return core.Connection
            .prototype[funcName].apply(this.connection, arguments);
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


function createPool (opts) {
  var corePool = core.createPool(opts);
  var Promise = opts.Promise || global.Promise || require('bluebird');

  var promisePool = {
    getConnection: function () {
      return new Promise(function (resolve, reject) {
        corePool.getConnection(function (err, coreConnection) {
          if (err) {
            reject(err);
          } else {
            resolve(new PromiseConnection(coreConnection, Promise));
          }
        });
      });
    },

    query: function (sql, args) {
      return new Promise(function (resolve, reject) {
        var done = makeDoneCb(resolve, reject);
        if (args) {
          corePool.query(sql, args, done);
        } else {
          corePool.query(sql, done);
        }
      });
    },

    execute: function (sql, values) {
      return new Promise(function (resolve, reject) {
        corePool.execute(sql, values, makeDoneCb(resolve, reject));
      });
    },

    end: function () {
      return new Promise(function (resolve, reject) {
        corePool.end(function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  };

  return promisePool;
}

module.exports.createConnection = createConnection;
module.exports.createPool = createPool;
