'use strict';

const { createLRU } = require('lru.min');

const INITIAL_CAPACITY = 16;

function closeStatement(_key, statement) {
  statement.close();
}

// lru.min allocates every slot of `max` up front, so the cache starts small
// and doubles on demand until it reaches `limit`.
function createStatementCache(limit) {
  const statements = createLRU({
    max: Math.min(limit, INITIAL_CAPACITY),
    onEviction: closeStatement,
  });
  const set = statements.set;

  statements.set = function (key, statement) {
    if (statements.size === statements.max && statements.max < limit) {
      statements.resize(Math.min(statements.max * 2, limit));
    }
    return set.call(statements, key, statement);
  };

  return statements;
}

module.exports = createStatementCache;
