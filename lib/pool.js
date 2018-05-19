var mysql = require('../index.js');

var EventEmitter = require('events').EventEmitter;
var Timers = require('timers');
var Util = require('util');
var PoolConnection = require('./pool_connection.js');
var Queue = require('denque');
var Connection = require('./connection.js');

module.exports = Pool;

Util.inherits(Pool, EventEmitter);
function Pool(options) {
  EventEmitter.call(this);
  this.config = options.config;
  this.config.connectionConfig.pool = this;

  this._allConnections = new Queue();
  this._freeConnections = new Queue();
  this._connectionQueue = new Queue();
  this._closed = false;
  if (this.config.autoOpenConnections && this.config.minConnections) {
    var self = this;
    var opened = 0;
    for (var i = 0; i < this.config.minConnections; i++) {
      this.getConnection(function (err, conn) {
        process.nextTick(function () {
          if (++opened === self.config.minConnections) {
            self._openingConnections = false;
          }
          if (err || !conn) {
            var queueCB = self._connectionQueue.shift();
            if (queueCB) {
              queueCB(err)
            }
          } else {
            self.releaseConnection(conn);
          }
        });
      });
    }
    // This must be after the getConnection, or else its enqueued
    this._openingConnections = true;
  }
}

Pool.prototype.getConnection = function(cb) {
  if (this._closed) {
    return process.nextTick(function() {
      return cb(new Error('Pool is closed.'));
    });
  }
  if (this._openingConnections) {
    // We are opening a connect, use it when ready
    return this._connectionQueue.push(cb);
  }

  var connection;

  if (this._freeConnections.length > 0) {
    connection = this._freeConnections.shift();

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
};

Pool.prototype.releaseConnection = function(connection) {
  var cb;

  connection._lastReleased = Date.now();
  if (!connection._pool || connection._closed || connection._closing) {
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
    this._manageExpiredTimer();
  }
};

Pool.prototype.end = function(cb) {
  this._closed = true;

  if (typeof cb != 'function') {
    cb = function(err) {
      if (err) {
        throw err;
      }
    };
  }

  var calledBack = false;
  var closedConnections = 0;
  var numConnections = this._allConnections.length;

  var endCB = function(err) {
    if (calledBack) {
      return;
    }

    if (err || ++closedConnections >= numConnections) {
      calledBack = true;
      cb(err);
      return;
    }
  }.bind(this);

  if (this._allConnections.length === 0) {
    endCB();
    return;
  }

  var connection;
  while ((connection = this._allConnections.shift())) {
    this._closeConnection(connection, endCB);
  }
};

Pool.prototype.query = function(sql, values, cb) {
  var cmdQuery = Connection.createQuery(
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
};

Pool.prototype.execute = function(sql, values, cb) {
  var useNamedPlaceholders = this.config.connectionConfig.namedPlaceholders;

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
};

Pool.prototype._manageExpiredTimer = function() {
  var hasExtra = this._allConnections.length > this.config.minConnections;
  if (hasExtra && !this._expiredTimer) {
    this._expiredTimer = Timers.setInterval(
      Pool.prototype._closeIdleConnections.bind(this),
      Math.min(15, this.config.idleTimeout) * 1000
    );
  } else if (!hasExtra && this._expiredTimer) {
    Timers.clearInterval(this._expiredTimer);
    this._expiredTimer = null;
  }
};

Pool.prototype._closeIdleConnections = function() {
  var now = Date.now();
  var timeout = this.config.idleTimeout * 1000;
  var length = this._freeConnections.length;
  var numExtra = this._allConnections.length - this.config.minConnections;
  for (var i = 0; numExtra > 0 && i < length; i++) {
    var conn = this._freeConnections.get(i);

    if (now > conn._lastReleased + timeout) {
      // This connection has been unused for longer than the timeout
      this._closeConnection(conn);
      // decrement i and length as the length will be reduced by 1 by closeConnection
      i--;
      length--;
      numExtra--;
    }
  }
  this._manageExpiredTimer();
};

Pool.prototype._removeConnection = function(connection) {
  // Remove connection from all connections
  spliceConnection(this._allConnections, connection);

  // Remove connection from free connections
  spliceConnection(this._freeConnections, connection);

  this.releaseConnection(connection);

  this._manageExpiredTimer();
};

Pool.prototype._closeConnection = function (connection, cb) {
  connection._realEnd(cb);
  this._removeConnection(connection);
};

Pool.prototype.format = function(sql, values) {
  return mysql.format(
    sql,
    values,
    this.config.connectionConfig.stringifyObjects,
    this.config.connectionConfig.timezone
  );
};

Pool.prototype.escape = function(value) {
  return mysql.escape(
    value,
    this.config.connectionConfig.stringifyObjects,
    this.config.connectionConfig.timezone
  );
};

Pool.prototype.escapeId = function escapeId(value) {
  return mysql.escapeId(value, false);
};

function spliceConnection(queue, connection) {
  var len = queue.length;
  for (var i = 0; i < len; i++) {
    if (queue.get(i) === connection) {
      queue.removeOne(i);
      break;
    }
  }
}
