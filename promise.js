var core = require('./index.js');

function createConnection (opts) {
  var coreConnection = core.createConnection(opts);
  var Promise = opts.Promise || global.Promise;
  if (!Promise) {
    throw new Error('no Promise implementation available.' +
      'Use promise-enabled node version or pass userland Promise' +
      ' implementation as parameter, for example: { Promise: require(\'es6-promise\').Promise }');
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

function createPool (opts) {
  var corePool = core.createPool(opts);
  var Promise = opts.Promise || global.Promise || require('es6-promise');

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
