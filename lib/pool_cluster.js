'use strict';

const Pool = require('./pool.js');
const PoolConfig = require('./pool_config.js');
const EventEmitter = require('events').EventEmitter;

/**
 * Selector
 */
const makeSelector = {
  RR() {
    let index = 0;
    return clusterIds => clusterIds[index++ % clusterIds.length];
  },
  RANDOM() {
    return clusterIds =>
      clusterIds[Math.floor(Math.random() * clusterIds.length)];
  },
  ORDER() {
    return clusterIds => clusterIds[0];
  }
};

class PoolNamespace {
  constructor(cluster, pattern, selector) {
    this._cluster = cluster;
    this._pattern = pattern;
    this._selector = makeSelector[selector]();
  }

  getConnection(cb) {
    const clusterNode = this._getClusterNode();
    if (clusterNode === null) {
      return cb(new Error('Pool does Not exists.'));
    }
    return this._cluster._getConnection(clusterNode, (err, connection) => {
      if (err) {
        return cb(err);
      }
      if (connection === 'retry') {
        return this.getConnection(cb);
      }
      return cb(null, connection);
    });
  }

  _getClusterNode() {
    const foundNodeIds = this._cluster._findNodeIds(this._pattern);
    if (foundNodeIds.length === 0) {
      return null;
    }
    const nodeId =
      foundNodeIds.length === 1
        ? foundNodeIds[0]
        : this._selector(foundNodeIds);
    return this._cluster._getNode(nodeId);
  }
}

class PoolCluster extends EventEmitter {
  constructor(config) {
    super();
    config = config || {};
    this._canRetry =
      typeof config.canRetry === 'undefined' ? true : config.canRetry;
    this._removeNodeErrorCount = config.removeNodeErrorCount || 5;
    this._defaultSelector = config.defaultSelector || 'RR';
    this._closed = false;
    this._lastId = 0;
    this._nodes = {};
    this._serviceableNodeIds = [];
    this._namespaces = {};
    this._findCaches = {};
  }

  of(pattern, selector) {
    pattern = pattern || '*';
    selector = selector || this._defaultSelector;
    selector = selector.toUpperCase();
    if (!makeSelector[selector] === 'undefined') {
      selector = this._defaultSelector;
    }
    const key = pattern + selector;
    if (typeof this._namespaces[key] === 'undefined') {
      this._namespaces[key] = new PoolNamespace(this, pattern, selector);
    }
    return this._namespaces[key];
  }

  add(id, config) {
    if (typeof id === 'object') {
      config = id;
      id = `CLUSTER::${++this._lastId}`;
    }
    if (typeof this._nodes[id] === 'undefined') {
      this._nodes[id] = {
        id: id,
        errorCount: 0,
        pool: new Pool({ config: new PoolConfig(config) })
      };
      this._serviceableNodeIds.push(id);
      this._clearFindCaches();
    }
  }

  getConnection(pattern, selector, cb) {
    let namespace;
    if (typeof pattern === 'function') {
      cb = pattern;
      namespace = this.of();
    } else {
      if (typeof selector === 'function') {
        cb = selector;
        selector = this._defaultSelector;
      }
      namespace = this.of(pattern, selector);
    }
    namespace.getConnection(cb);
  }

  end(callback) {
    const cb =
      callback !== undefined
        ? callback
        : err => {
          if (err) {
            throw err;
          }
        };
    if (this._closed) {
      process.nextTick(cb);
      return;
    }
    this._closed = true;

    let calledBack = false;
    let waitingClose = 0;
    const onEnd = err => {
      if (!calledBack && (err || --waitingClose <= 0)) {
        calledBack = true;
        return cb(err);
      }
    };

    for (const id in this._nodes) {
      waitingClose++;
      this._nodes[id].pool.end();
    }
    if (waitingClose === 0) {
      process.nextTick(onEnd);
    }
  }

  _findNodeIds(pattern) {
    if (typeof this._findCaches[pattern] !== 'undefined') {
      return this._findCaches[pattern];
    }
    let foundNodeIds;
    if (pattern === '*') {
      // all
      foundNodeIds = this._serviceableNodeIds;
    } else if (this._serviceableNodeIds.indexOf(pattern) !== -1) {
      // one
      foundNodeIds = [pattern];
    } else {
      // wild matching
      const keyword = pattern.substring(pattern.length - 1, 0);
      foundNodeIds = this._serviceableNodeIds.filter(id =>
        id.startsWith(keyword)
      );
    }
    this._findCaches[pattern] = foundNodeIds;
    return foundNodeIds;
  }

  _getNode(id) {
    return this._nodes[id] || null;
  }

  _increaseErrorCount(node) {
    if (++node.errorCount >= this._removeNodeErrorCount) {
      const index = this._serviceableNodeIds.indexOf(node.id);
      if (index !== -1) {
        this._serviceableNodeIds.splice(index, 1);
        delete this._nodes[node.id];
        this._clearFindCaches();
        node.pool.end();
        this.emit('remove', node.id);
      }
    }
  }

  _decreaseErrorCount(node) {
    if (node.errorCount > 0) {
      --node.errorCount;
    }
  }

  _getConnection(node, cb) {
    node.pool.getConnection((err, connection) => {
      if (err) {
        this._increaseErrorCount(node);
        if (this._canRetry) {
          // REVIEW: this seems wrong?
          this.emit('warn', err);
          // eslint-disable-next-line no-console
          console.warn(`[Error] PoolCluster : ${err}`);
          return cb(null, 'retry');
        }
        return cb(err);
      }
      this._decreaseErrorCount(node);

      connection._clusterId = node.id;
      return cb(null, connection);
    });
  }

  _clearFindCaches() {
    this._findCaches = {};
  }
}

module.exports = PoolCluster;
