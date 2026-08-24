'use strict';

const EventEmitter = require('events').EventEmitter;
const PromisePreparedStatementInfo = require('./prepared_statement_info.js');
const {
  captureStackHolder,
  applyCapturedStack,
} = require('./capture_local_err.js');
const makeDoneCb = require('./make_done_cb.js');
const inheritEvents = require('./inherit_events.js');
const BaseConnection = require('../base/connection.js');

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
      'enqueue',
    ]);
  }

  release() {
    this.connection.release();
  }

  query(query, params) {
    const c = this.connection;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.query)
      : undefined;
    if (typeof params === 'function') {
      throw new Error(
        'Callback function is not available with promise clients.'
      );
    }
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, stackHolder);
      if (params !== undefined) {
        c.query(query, params, done);
      } else {
        c.query(query, done);
      }
    });
  }

  execute(query, params) {
    const c = this.connection;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.execute)
      : undefined;
    if (typeof params === 'function') {
      throw new Error(
        'Callback function is not available with promise clients.'
      );
    }
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, stackHolder);
      if (params !== undefined) {
        c.execute(query, params, done);
      } else {
        c.execute(query, done);
      }
    });
  }

  end() {
    return new this.Promise((resolve) => {
      this.connection.end(resolve);
    });
  }

  async [Symbol.asyncDispose]() {
    if (!this.connection._closing) {
      await this.end();
    }
  }

  beginTransaction() {
    const c = this.connection;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.beginTransaction)
      : undefined;
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, stackHolder);
      c.beginTransaction(done);
    });
  }

  commit() {
    const c = this.connection;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.commit)
      : undefined;
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, stackHolder);
      c.commit(done);
    });
  }

  rollback() {
    const c = this.connection;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.rollback)
      : undefined;
    return new this.Promise((resolve, reject) => {
      const done = makeDoneCb(resolve, reject, stackHolder);
      c.rollback(done);
    });
  }

  ping() {
    const c = this.connection;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.ping)
      : undefined;
    return new this.Promise((resolve, reject) => {
      c.ping((err) => {
        if (err) {
          applyCapturedStack(err, stackHolder);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  reset() {
    const c = this.connection;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.reset)
      : undefined;
    return new this.Promise((resolve, reject) => {
      c.reset((err) => {
        if (err) {
          applyCapturedStack(err, stackHolder);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  connect() {
    const c = this.connection;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.connect)
      : undefined;
    return new this.Promise((resolve, reject) => {
      c.connect((err, param) => {
        if (err) {
          applyCapturedStack(err, stackHolder);
          reject(err);
        } else {
          resolve(param);
        }
      });
    });
  }

  prepare(options) {
    const c = this.connection;
    const promiseImpl = this.Promise;
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.prepare)
      : undefined;
    return new this.Promise((resolve, reject) => {
      c.prepare(options, (err, statement) => {
        if (err) {
          applyCapturedStack(err, stackHolder);
          reject(err);
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
    const stackHolder = c.config.trace
      ? captureStackHolder(PromiseConnection.prototype.changeUser)
      : undefined;
    return new this.Promise((resolve, reject) => {
      c.changeUser(options, (err) => {
        if (err) {
          applyCapturedStack(err, stackHolder);
          reject(err);
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
// patching PromiseConnection
// create facade functions for prototype functions on "Connection" that are not yet
// implemented with PromiseConnection

// proxy synchronous functions only
(function (functionsToWrap) {
  for (let i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
    const func = functionsToWrap[i];

    if (
      typeof BaseConnection.prototype[func] === 'function' &&
      PromiseConnection.prototype[func] === undefined
    ) {
      PromiseConnection.prototype[func] = (function factory(funcName) {
        return function () {
          return BaseConnection.prototype[funcName].apply(
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
  'unprepare',
]);

module.exports = PromiseConnection;
