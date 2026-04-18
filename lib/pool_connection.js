'use strict';

const Connection = require('./connection.js');

class PoolConnection extends Connection {
  constructor(pool, options) {
    super(options);
    this._pool = pool;
    this._released = false;
    this.lastActiveTime = Date.now();
    this.once('end', () => {
      this._removeFromPool();
    });
    this.once('error', () => {
      this._removeFromPool();
    });
  }

  release() {
    if (this._released) {
      return;
    }
    if (!this._pool || this._pool._closed) {
      return;
    }
    this._released = true;
    this.lastActiveTime = Date.now();
    this._pool.releaseConnection(this);
  }

  [Symbol.dispose]() {
    this.release();
  }

  end(callback) {
    if (this.config.gracefulEnd) {
      this._removeFromPool();
      super.end(callback);

      return;
    }

    const err = new Error(
      'Calling conn.end() to release a pooled connection is ' +
        'deprecated. In next version calling conn.end() will be ' +
        'restored to default conn.end() behavior. Use ' +
        'conn.release() instead.'
    );
    this.emit('warn', err);
    console.warn(err.message);
    this.release();
    if (typeof callback === 'function') {
      callback();
    }
  }

  destroy() {
    this._removeFromPool();
    super.destroy();
  }

  _removeFromPool() {
    if (!this._pool || this._pool._closed) {
      return;
    }
    const pool = this._pool;
    this._pool = null;
    pool._removeConnection(this);
  }

  promise(promiseImpl) {
    const PromisePoolConnection = require('./promise/pool_connection.js');
    return new PromisePoolConnection(this, promiseImpl);
  }
}

PoolConnection.statementKey = Connection.statementKey;
module.exports = PoolConnection;

// TODO: Remove this when we are removing PoolConnection#end
PoolConnection.prototype._realEnd = Connection.prototype.end;
