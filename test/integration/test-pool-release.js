var createPool = require('../common.js').createPool;
var assert = require('assert');

var pool = createPool();

pool.query('test sql', function(err, res, rows) {
  pool.query('test sql', [], function(err, res, rows) {
    pool.query('test sql', [], function(err, res, rows) {
      pool.query('test sql', [], function(err, res, rows) {
        pool.query('test sql', function(err, res, rows) {
          pool.query('test sql').on('error', function(err) {
            pool.query('test sql', function(err, res, rows) {
              pool.execute('test sql', function(err, res, rows) {
                pool.execute('test sql', function(err, res, rows) {
                  pool.execute('test sql', [], function(err, res, rows) {
                    pool.execute('test sql', function(err) {
                      pool.execute('test sql', function(err, res, rows) {
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
