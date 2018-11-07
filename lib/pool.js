'use strict';

const mysql = require('../index.js');

const EventEmitter = require('events').EventEmitter;
const PoolConnection = require('./pool_connection.js');
const Queue = require('denque');
const Connection = require('./connection.js');

function spliceConnection(queue, connection) {
  const len = queue.length;
  for (let i = 0; i < len; i++) {
    if (queue.get(i) === connection) {
      queue.removeOne(i);
      break;
    }
  }
}

class Pool extends EventEmitter {
  constructor(options) {
    super();
    this.config = options.config;
    this.config.connectionConfig.pool = this;
    this._allConnections = new Queue();
    this._freeConnections = new Queue();
    this._connectionQueue = new Queue();
    this._closed = false;
  }

  promise(promiseImpl) {
    const PromisePool = require('../promise').PromisePool;
    return new PromisePool(this, promiseImpl);
  }

  getConnection(cb) {
    if (this._closed) {
      return process.nextTick(function() {
        return cb(new Error('Pool is closed.'));
      });
    }
    let connection;
    if (this._freeConnections.length > 0) {
      connection = this._freeConnections.shift();
      this.emit('acquire', connection);
      return process.nextTick(function() {
        return cb(null, connection);
      });
    }
    if (
      this.config.connectionLimit === 0 ||
      this._allConnections.length < this.config.connectionLimit
    ) {
      connection = new PoolConnection(this, {
        config: this.config.connectionConfig
      });
      this._allConnections.push(connection);
      return connection.connect(
        function(err) {
          if (this._closed) {
            return cb(new Error('Pool is closed.'));
          }
          if (err) {
            return cb(err);
          }
          this.emit('connection', connection);
          this.emit('acquire', connection);
          return cb(null, connection);
        }.bind(this)
      );
    }
    if (!this.config.waitForConnections) {
      return process.nextTick(function() {
        return cb(new Error('No connections available.'));
      });
    }
    if (
      this.config.queueLimit &&
      this._connectionQueue.length >= this.config.queueLimit
    ) {
      return cb(new Error('Queue limit reached.'));
    }
    this.emit('enqueue');
    return this._connectionQueue.push(cb);
  }

  releaseConnection(connection) {
    let cb;
    if (!connection._pool) {
      // The connection has been removed from the pool and is no longer good.
      if (this._connectionQueue.length) {
        cb = this._connectionQueue.shift();
        process.nextTick(this.getConnection.bind(this, cb));
      }
    } else if (this._connectionQueue.length) {
      cb = this._connectionQueue.shift();
      process.nextTick(cb.bind(null, null, connection));
    } else {
      this._freeConnections.push(connection);
      this.emit('release', connection);
    }
  }

  end(cb) {
    this._closed = true;
    if (typeof cb != 'function') {
      cb = function(err) {
        if (err) {
          throw err;
        }
      };
    }
    let calledBack = false;
    let closedConnections = 0;
    let connection;
    const endCB = function(err) {
      if (calledBack) {
        return;
      }
      if (err || ++closedConnections >= this._allConnections.length) {
        calledBack = true;
        cb(err);
        return;
      }
    }.bind(this);
    if (this._allConnections.length === 0) {
      endCB();
      return;
    }
    for (let i = 0; i < this._allConnections.length; i++) {
      connection = this._allConnections.get(i);
      connection._realEnd(endCB);
    }
  }

  query(sql, values, cb) {
    const cmdQuery = Connection.createQuery(
      sql,
      values,
      cb,
      this.config.connectionConfig
    );
    cmdQuery.namedPlaceholders = this.config.connectionConfig.namedPlaceholders;
    this.getConnection(function(err, conn) {
      if (err) {
        if (typeof cmdQuery.onResult === 'function') {
          cmdQuery.onResult(err);
        } else {
          cmdQuery.emit('error', err);
        }
        return;
      }
      conn.query(cmdQuery).once('end', function() {
        conn.release();
      });
    });
    return cmdQuery;
  }

  execute(sql, values, cb) {
    // TODO construct execute command first here and pass it to connection.execute
    // so that polymorphic arguments logic is there in one place
    if (typeof values == 'function') {
      cb = values;
      values = [];
    }
    this.getConnection(function(err, conn) {
      if (err) {
        return cb(err);
      }
      const executeCmd = conn.execute(sql, values, cb);
      executeCmd.once('end', function() {
        conn.release();
      });
    });
  }

  _removeConnection(connection) {
    // Remove connection from all connections
    spliceConnection(this._allConnections, connection);
    // Remove connection from free connections
    spliceConnection(this._freeConnections, connection);
    this.releaseConnection(connection);
  }

  format(sql, values) {
    return mysql.format(
      sql,
      values,
      this.config.connectionConfig.stringifyObjects,
      this.config.connectionConfig.timezone
    );
  }

  escape(value) {
    return mysql.escape(
      value,
      this.config.connectionConfig.stringifyObjects,
      this.config.connectionConfig.timezone
    );
  }

  escapeId(value) {
    return mysql.escapeId(value, false);
  }
}

module.exports = Pool;
