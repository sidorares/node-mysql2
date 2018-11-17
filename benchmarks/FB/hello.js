'use strict';

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', worker => {
    console.log('worker ' + worker.pid + ' died');
  });

  return;
}

const http = require('http');
const url = require('url');
const libmysql = require('mysql-libmysqlclient').createConnectionSync();
const mysql2 = require('../..');
const mysql = require('mysql');
const mariasql = require('mariasql');
const async = require('async');
const Mapper = require('mapper');
const jade = require('jade');
const fs = require('fs');
const connMap = {
  user: 'root',
  password: '',
  database: 'hello_world',
  host: 'localhost'
};

Mapper.connect(
  connMap,
  { verbose: false, strict: false }
);
const World = Mapper.map('World', 'id', 'randomNumber');

const template = jade.compile(fs.readFileSync('./fortunes.jade'));

libmysql.connectSync('localhost', 'root', '', 'hello_world');
const pool2 = mysql2.createPool(connMap);
const mysql2conn = mysql2.createConnection(connMap);
const mysql1conn = mysql.createConnection(connMap);
const mariaconn = new mariasql();
mariaconn.connect({
  host: connMap.host,
  user: connMap.user,
  password: connMap.password,
  db: connMap.database
});

function getRandomNumber() {
  return Math.floor(Math.random() * 10000) + 1;
}

function sequelizeQuery(callback) {
  World.findById(getRandomNumber(), (err, world) => {
    callback(null, world);
  });
}

function handlePrepared(req, res) {
  const values = url.parse(req.url, true);
  const queries = values.query.queries || 1;
  const results = [];
  for (let i = 0; i < queries; ++i) {
    mysql2conn.execute(
      'SELECT * FROM world WHERE id = ?',
      [getRandomNumber()],
      (err, rows) => {
        results.push(rows[0]);
        if (results.length == queries) res.end(JSON.stringify(results));
      }
    );
  }
}

function handleMysqlIsh(conn, req, res) {
  const values = url.parse(req.url, true);
  const queries = values.query.queries || 1;
  //pool.getConnection(function(err, conn) {
  //console.log(conn, conn.query, '===============');
  const results = [];
  for (let i = 0; i < queries; ++i) {
    mysql2conn.query(
      'SELECT * FROM world WHERE id = ?',
      [getRandomNumber()],
      (err, rows) => {
        results.push(rows[0]);
        if (results.length == queries) res.end(JSON.stringify(results));
      }
    );
  }
  //});
}

function handleMysqlIshPool(pool, req, res) {
  const values = url.parse(req.url, true);
  const queries = values.query.queries || 1;
  const results = [];
  for (let i = 0; i < queries; ++i) {
    pool.getConnection(() => {
      mysql2conn.query(
        'SELECT * FROM world WHERE id = ' + getRandomNumber(),
        (err, rows) => {
          results.push(rows[0]);
          if (results.length == queries) res.end(JSON.stringify(results));
        }
      );
    });
  }
}

function handleMaria(req, res) {
  const values = url.parse(req.url, true);
  const queries = values.query.queries || 1;
  const results = [];
  for (let i = 0; i < queries; ++i) {
    mariaconn
      .query('SELECT * FROM world WHERE id = :id', { id: getRandomNumber() })
      .on('result', dbres => {
        dbres.on('row', row => {
          results.push(row);
          if (results.length == queries) res.end(JSON.stringify(results));
        });
      });
  }
}

function sortFortunes(a, b) {
  return a.message < b.message ? -1 : a.message > b.message ? 1 : 0;
}

function fortuneMysql(conn, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  conn.query('select * from Fortune', (err, fortunes) => {
    fortunes.push({
      id: 0,
      message: 'Additional fortune added at request time.'
    });
    fortunes.sort(sortFortunes);
    res.end(template({ fortunes: fortunes }));
  });
}

function fortuneMaria(res) {
  const fortunes = [];
  res.writeHead(200, { 'Content-Type': 'text/html' });
  mariaconn.query('SELECT * from Fortune').on('result', dbres => {
    dbres.on('row', row => {
      fortunes.push(row);
    });
    dbres.on('end', () => {
      fortunes.push({
        id: 0,
        message: 'Additional fortune added at request time.'
      });
      fortunes.sort(sortFortunes);
      res.end(template({ fortunes: fortunes }));
    });
  });
}

http
  .createServer((req, res) => {
    // JSON response object
    const hello = { message: 'Hello, world' };

    const path = url.parse(req.url).pathname;

    let values;
    let queries;
    let queryFunctions;
    /* eslint-disable no-case-declarations, no-inner-declarations */
    switch (path) {
      case '/json':
        // JSON Response Test
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=UTF-8'
        });
        // Write JSON object to response
        res.end(JSON.stringify(hello));
        break;

      case '/mysql-orm':
        values = url.parse(req.url, true);
        queries = values.query.queries || 1;
        queryFunctions = new Array(queries);

        for (let i = 0; i < queries; i += 1) {
          queryFunctions[i] = sequelizeQuery;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });

        async.parallel(queryFunctions, (err, results) => {
          res.end(JSON.stringify(results));
        });
        break;

      case '/mysql':
        res.writeHead(200, { 'Content-Type': 'application/json' });

        function libmysqlQuery2(callback) {
          libmysql.query(
            'SELECT * FROM world WHERE id = ' + getRandomNumber(),
            (err, res) => {
              if (err) {
                throw err;
              }

              res.fetchAll((err, rows) => {
                if (err) {
                  throw err;
                }

                res.freeSync();
                callback(null, rows[0]);
              });
            }
          );
        }

        values = url.parse(req.url, true);
        queries = values.query.queries || 1;
        queryFunctions = new Array(queries);

        for (let i = 0; i < queries; i += 1) {
          queryFunctions[i] = libmysqlQuery2;
        }
        async.parallel(queryFunctions, (err, results) => {
          if (err) {
            res.writeHead(500);
            return res.end('MYSQL CONNECTION ERROR.');
          }
          res.end(JSON.stringify(results));
        });
        break;

      case '/mysql2':
        handleMysqlIsh(mysql2conn, req, res);
        break;

      case '/fortunes-mysql2':
        fortuneMysql(mysql2conn, res);
        break;

      case '/fortunes-mysql1':
        fortuneMysql(mysql1conn, res);
        break;

      case '/fortunes-maria':
        fortuneMaria(res);
        break;

      case '/mysql2pool':
        handleMysqlIshPool(pool2, req, res);
        break;

      case '/mysql2ps':
        handlePrepared(req, res);
        break;

      case '/mysql1':
        handleMysqlIsh(mysql1conn, req, res);
        break;

      case '/maria':
        handleMaria(req, res);
        break;

      case '/update':
        res.writeHead(200, { 'Content-Type': 'application/json' });

        function libmysqlQuery(callback) {
          libmysql.query(
            'SELECT * FROM world WHERE id = ' + getRandomNumber(),
            (err, res) => {
              if (err) {
                throw err;
              }

              res.fetchAll((err, rows) => {
                if (err) {
                  throw err;
                }

                res.freeSync();

                rows[0].randomNumber = getRandomNumber();
                libmysql.query(
                  'UPDATE World SET randomNumber = ' +
                    rows[0].randomNumber +
                    ' WHERE id = ' +
                    rows[0]['id'],
                  err => {
                    if (err) {
                      throw err;
                    }
                  }
                );
                callback(null, rows[0]);
              });
            }
          );
        }

        values = url.parse(req.url, true);
        queries = values.query.queries || 1;
        queryFunctions = new Array(queries);

        for (let i = 0; i < queries; i += 1) {
          queryFunctions[i] = libmysqlQuery;
        }
        async.parallel(queryFunctions, (err, results) => {
          if (err) {
            res.writeHead(500);
            return res.end('MYSQL CONNECTION ERROR.');
          }
          res.end(JSON.stringify(results));
        });
        break;

      default:
        // File not found handler
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end('NOT IMPLEMENTED');
    }
    /* eslint-enable no-case-declarations no-inner-declarations */
  })
  .listen(8080);
