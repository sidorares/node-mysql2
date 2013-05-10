var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if(cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.pid + ' died');
  });

  return;
}

var http     = require('http');
var url      = require('url');
var libmysql = require('mysql-libmysqlclient').createConnectionSync();
var mysql2   = require('../..');
var mysql    = require('mysql');
var mariasql = require('mariasql');
var async    = require('async');
var Mapper   = require('mapper');
var jade     = require('jade');
var fs       = require('fs');
var connMap  = { user: 'root', password: '', database: 'hello_world', host: 'localhost' };

Mapper.connect(connMap, {verbose: false, strict: false});
var World = Mapper.map("World", "id", "randomNumber");

var template = jade.compile(fs.readFileSync('./fortunes.jade'));

libmysql.connectSync('localhost', 'root', '', 'hello_world');
pool2 = mysql2.createPool(connMap);
pool1 = mysql.createPool(connMap);
mysql2conn = mysql2.createConnection(connMap);
mysql1conn = mysql.createConnection(connMap);
mariaconn = new mariasql();
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
  World.findById(getRandomNumber(), function (err, world) {
    callback(null, world);
  });
}

function handlePrepared(req, res) {
  var values = url.parse(req.url, true);
  var queries = values.query.queries || 1;
  var results = [];
  for (var i=0; i < queries; ++i) {
    mysql2conn.execute("SELECT * FROM world WHERE id = ?", [getRandomNumber()], function (err, rows) {
      results.push(rows[0]);
      if (results.length == queries)
        res.end(JSON.stringify(results));
    });
  }
}

function handleMysqlIsh(conn, req, res) {
    var values = url.parse(req.url, true);
    var queries = values.query.queries || 1;
    //pool.getConnection(function(err, conn) {
      //console.log(conn, conn.query, '===============');
      var results = [];
      for (var i=0; i < queries; ++i) {
        mysql2conn.query("SELECT * FROM world WHERE id = ?", [getRandomNumber()], function (err, rows) {
          results.push(rows[0]);
          if (results.length == queries)
            res.end(JSON.stringify(results));
        });
      }
    //});
}

function handleMysqlIshPool(pool, req, res) {
    var values = url.parse(req.url, true);
    var queries = values.query.queries || 1;
    var results = [];
    for (var i=0; i < queries; ++i) {
      pool.getConnection(function(err, conn) {
        mysql2conn.query("SELECT * FROM world WHERE id = " + getRandomNumber(), function (err, rows) {
          results.push(rows[0]);
          if (results.length == queries)
            res.end(JSON.stringify(results));
        });
      });
    }
}

function handleMaria(req, res)
{
  var values = url.parse(req.url, true);
  var queries = values.query.queries || 1;
  var results = [];
  for (var i=0; i < queries; ++i) {
    mariaconn.query("SELECT * FROM world WHERE id = :id", { id: getRandomNumber() } )
      .on('result', function (dbres) {
        dbres.on('row', function(row) {
          results.push(row);
          if (results.length == queries)
            res.end(JSON.stringify(results));
        });
      });
  }
}

function fortuneMysql(conn, res) {
  var fortunes = [];
  res.writeHead(200, {'Content-Type': 'text/html'});
  conn.query('select * from Fortune', function(err, fortunes) {
    fortunes.push({id: 0, message: "Additional fortune added at request time."});
    fortunes.sort(sortFortunes);
    res.end(template({fortunes: fortunes}));
  });
}

function fortuneMaria(res) {
  fortunes = [];
  res.writeHead(200, {'Content-Type': 'text/html'});
  mariaconn.query("SELECT * from Fortune")
       .on('result', function (dbres) {
         dbres.on('row', function(row) { fortunes.push(row); });
         dbres.on('end', function() {
           fortunes.push({id: 0, message: "Additional fortune added at request time."});
           fortunes.sort(sortFortunes);
           res.end(template({fortunes: fortunes}));
         });
  });
}

function sortFortunes(a, b) {
  return (a.message < b.message) ? -1 : (a.message > b.message) ? 1 : 0;
}

http.createServer(function (req, res) {
  // JSON response object
  var hello = {message: "Hello, world"};

  var path = url.parse(req.url).pathname;

  switch (path) {
  case '/json':
    // JSON Response Test
    res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
    // Write JSON object to response
    res.end(JSON.stringify(hello));
    break;

  case '/mysql-orm':
    var values = url.parse(req.url, true);
    var queries = values.query.queries || 1;
    var queryFunctions = new Array(queries);

    for (var i = 0; i < queries; i += 1) {
      queryFunctions[i] = sequelizeQuery;
    }

    res.writeHead(200, {'Content-Type': 'application/json'});

    async.parallel(queryFunctions, function(err, results) {
      res.end(JSON.stringify(results));
    });
    break;

  case '/mysql':
    res.writeHead(200, {'Content-Type': 'application/json'});

    function libmysqlQuery(callback) {
      libmysql.query("SELECT * FROM world WHERE id = " + getRandomNumber(), function (err, res) {
        if (err) {
	        throw err;
	      }

	      res.fetchAll(function(err, rows) {
      	  if (err) {
      	    throw err;
      	  }

      	  res.freeSync();
      	  callback(null, rows[0]);
        });
      });
    }

    var values = url.parse(req.url, true);
    var queries = values.query.queries || 1;
    var queryFunctions = new Array(queries);

    for (var i = 0; i < queries; i += 1) {
      queryFunctions[i] = libmysqlQuery;
    }
    async.parallel(queryFunctions, function(err, results) {
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
    res.writeHead(200, {'Content-Type': 'application/json'});

    function libmysqlQuery(callback) {
      libmysql.query("SELECT * FROM world WHERE id = " + getRandomNumber(), function (err, res) {
        if (err) {
          throw err;
        }

        res.fetchAll(function(err, rows) {
          if (err) {
            throw err;
          }

          res.freeSync();

          rows[0].randomNumber = getRandomNumber();
          libmysql.query("UPDATE World SET randomNumber = " + rows[0].randomNumber + " WHERE id = " + rows[0]['id'], function (err, res) {
            if (err) {
              throw err;
            }
          });
          callback(null, rows[0]);
        });
      });
    }

    var values = url.parse(req.url, true);
    var queries = values.query.queries || 1;
    var queryFunctions = new Array(queries);

    for (var i = 0; i < queries; i += 1) {
      queryFunctions[i] = libmysqlQuery;
    }
    async.parallel(queryFunctions, function(err, results) {
      if (err) {
        res.writeHead(500);
        return res.end('MYSQL CONNECTION ERROR.');
      }
      res.end(JSON.stringify(results));
    });
    break;

  default:
    // File not found handler
    res.writeHead(404, {'Content-Type': 'text/html; charset=UTF-8'});
    res.end("NOT IMPLEMENTED");
  }
}).listen(8080);
