'use strict';

const createPool = require('../common.js').createPool;
const assert = require('assert');

const pool = createPool();

pool.query('test sql', function() {
  pool.query('test sql', [], function() {
    pool.query('test sql', [], function() {
      pool.query('test sql', [], function() {
        pool.query('test sql', function() {
          pool.query('test sql').on('error', function() {
            pool.query('test sql', function() {
              pool.execute('test sql', function() {
                pool.execute('test sql', function() {
                  pool.execute('test sql', [], function() {
                    pool.execute('test sql', function() {
                      pool.execute('test sql', function() {
                        // TODO change order events are fires so that connection is released before callback
                        // that way this number will be more deterministic
                        assert(pool._allConnections.length < 3);
                        assert(pool._freeConnections.length === 1);
                        assert(pool._connectionQueue.length === 0);
                        pool.end();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
