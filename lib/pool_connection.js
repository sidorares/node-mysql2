'use strict';

const { Connection } = require('../index.js');

class PoolConnection extends Connection {
  constructor(pool, options) {
    super(options);
    this._pool = pool;
    // When a fatal error occurs the connection's protocol ends, which will cause
    // the connection to end as well, thus we only need to watch for the end event
    // and we will be notified of disconnects.
    this.on('end', function() {
      this._removeFromPool();
    });
    this.on('error', function() {
      this._removeFromPool();
    });
  }

  release() {
    if (!this._pool || this._pool._closed) {
      return;
    }
    this._pool.releaseConnection(this);
  }

  promise(promiseImpl) {
    const PromisePoolConnection = require('../promise').PromisePoolConnection;
    return new PromisePoolConnection(this, promiseImpl);
  }

  end() {
    const err = new Error(
      'Calling conn.end() to release a pooled connection is ' +
        'deprecated. In next version calling conn.end() will be ' +
        'restored to default conn.end() behavior. Use ' +
        'conn.release() instead.'
    );
    this.emit('warn', err);
    // eslint-disable-next-line no-console
    console.warn(err.message);
    this.release();
  }

  destroy() {
    this._removeFromPool();
    return Connection.prototype.destroy.apply(this, arguments);
  }

  _removeFromPool() {
    if (!this._pool || this._pool._closed) {
      return;
    }
    const pool = this._pool;
    this._pool = null;
    pool._removeConnection(this);
  }
}

PoolConnection.statementKey = Connection.statementKey;
module.exports = PoolConnection;

// TODO: Remove this when we are removing PoolConnection#end
PoolConnection.prototype._realEnd = Connection.prototype.end;
