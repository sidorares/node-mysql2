'use strict';

const pool = require('mysql2').createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
  password: 'root'
});

setInterval(function() {
  for (let i = 0; i < 5; ++i) {
    pool.query(function(err, db) {
      console.log(rows, fields);
      // Connection is automatically released once query resolves
    });
  }
}, 1000);

setInterval(function() {
  for (let i = 0; i < 5; ++i) {
    pool.getConnection(function(err, db) {
      db.query('select sleep(0.5) as qqq', function(err, rows, fields) {
        console.log(rows, fields);
        db.release();
      });
    });
  }
}, 1000);
