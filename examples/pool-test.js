'use strict';

const pool = require('mysql2').createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
  password: 'root'
});

setInterval(() => {
  for (let i = 0; i < 5; ++i) {
    pool.query((err, db) => {
      console.log(rows, fields);
      // Connection is automatically released once query resolves
    });
  }
}, 1000);

setInterval(() => {
  for (let i = 0; i < 5; ++i) {
    pool.getConnection((err, db) => {
      db.query('select sleep(0.5) as qqq', (err, rows, fields) => {
        console.log(rows, fields);
        db.release();
      });
    });
  }
}, 1000);
