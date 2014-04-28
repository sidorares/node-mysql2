#node-mysql2

[![Build Status](https://secure.travis-ci.org/sidorares/node-mysql2.png)](http://travis-ci.org/sidorares/node-mysql2) [![](https://gemnasium.com/sidorares/node-mysql2.png)](https://gemnasium.com/npms/mysql2) [TODO](https://github.com/cainus/node-coveralls): [![](https://coveralls.io/repos/sidorares/node-mysql2/badge.png)](https://coveralls.io/r/sidorares/node-mysql2)


Mysql client for node.js. Written in native JavaScript and aims to be mostly api compatible with [node-mysql](https://github.com/felixge/node-mysql)

[![NPM](https://nodei.co/npm/mysql2.png?downloads=true&stars=true)](https://nodei.co/npm/mysql2/)
[![NPM](https://nodei.co/npm-dl/mysql2.png?months=6)](https://nodei.co/npm/mysql2/)

## Features

 In addition to client-side query/escape and connection pooling

  - MySQL server API for proxies and mocks
  - SSL and compression
  - prepared statements
  - binlog protocol client

## Documentation

See [node-mysql](https://github.com/felixge/node-mysql) documentation. If you see api incompatibilities, please report via github issue.

## Known incompatibilities with node-mysql

All numeric types converted to numbers. In contrast to node-mysql `zeroFill` flag is ignored in type conversion
You need to check corresponding field zeroFill flag and convert to string manually if this is of importance to you.

DECIMAL and NEWDECIMAL types always returned as string

## Known not yet supported features

`LOAD DATA INFILE` and `SELECT INTO OUTFILE`
`client.changeUser()`

## Examples

Simple select:

```js
var mysql      = require('mysql2');
var connection = mysql.createConnection({ user: 'test', database: 'test'});

connection.query('SELECT 1+1 as test1', function(err, rows) {
  //
});
```

Prepared statement and parameters:

```js
var mysql      = require('mysql2');
var connection = mysql.createConnection({ user: 'test', database: 'test'});

connection.execute('SELECT 1+? as test1', [10], function(err, rows) {
  //
});
```

Connecting over encrypted connection:

```js
var fs         = require('fs');
var mysql      = require('mysql2');
var connection = mysql.createConnection({
   user: 'test',
   database: 'test',
   ssl: {
     key: fs.readFileSync('./certs/client-key.pem'),
     cert: fs.readFileSync('./certs/client-cert.pem')
   }
});
connection.query('SELECT 1+1 as test1', console.log);
```

You can use 'Amazon RDS' string as value to ssl property to connect to Amazon RDS mysql over ssl (in that case http://s3.amazonaws.com/rds-downloads/mysql-ssl-ca-cert.pem CA cert is used)

```
var mysql      = require('mysql2');
var connection = mysql.createConnection({
   user: 'foo',
   password: 'bar',
   host: 'db.id.ap-southeast-2.rds.amazonaws.com',
   ssl: 'Amazon RDS'
});

conn.query('show status like \'Ssl_cipher\'', function(err, res) {
  console.log(err, res);
  conn.end();
});
```
Receiving rows as array of columns instead of hash with column name as key:

```js
var options = {sql: 'select A,B,C,D from foo', rowsAsArray: true};
connection.query(options, function(err, results) {
  /* results will be an array of arrays like this now:
  [[
     'field A value',
     'field B value',
     'field C value',
     'field D value',
  ], ...]
  */
});

```

Connecting using custom stream:

```js
var net        = require('net');
var mysql      = require('mysql2');
var shape      = require('shaper');
var connection = mysql.createConnection({
   user: 'test',
   database: 'test',
   stream: net.connect('/tmp/mysql.sock').pipe(shape(10)) // emulate 10 bytes/sec link
});
connection.query('SELECT 1+1 as test1', console.log);
```

Simple mysql proxy server:

```js
var mysql = require('mysql2');

var server = mysql.createServer();
server.listen(3307);
server.on('connection', function(conn) {
  console.log('connection');

  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff
  });

  conn.on('field_list', function(table, fields) {
    console.log('field list:', table, fields);
    conn.writeEof();
  });

  var remote = mysql.createConnection({user: 'root', database: 'dbname', host:'server.example.com', password: 'secret'});

  conn.on('query', function(sql) {
    console.log('proxying query:' + sql);
    remote.query(sql, function(err) { // overloaded args, either (err, result :object)
                                      // or (err, rows :array, columns :array)
      if (Array.isArray(arguments[1])) {
        // response to a 'select', 'show' or similar
        var rows = arguments[1], columns = arguments[2];
        console.log('rows', rows);
        console.log('columns', columns);
        conn.writeTextResult(rows, columns);
      } else {
        // response to an 'insert', 'update' or 'delete'
        var result = arguments[1];
        console.log('result', result);
        conn.writeOk(result);
      }
    });
  });

  conn.on('end', remote.end.bind(remote));
});
```
## MySQL Server API

### Server

  *  **createServer()** - creates server instance
  *  **Server.listen**  - listen port / unix socket (same arguments as [net.Server.listen](http://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback))

events:

  *  **connect** - new incoming connection.

### Connection

  *  **serverHandshake({serverVersion, protocolVersion, connectionId, statusFlags, characterSet, capabilityFlags})** - send server handshake initialisation packet, wait handshake response and start listening for commands
  *  **writeOk({affectedRows: num, insertId: num})** - send [OK packet](http://dev.mysql.com/doc/internals/en/overview.html#packet-OK_Packet) to client
  *  **writeEof(warnings, statusFlags)** - send EOF packet
  *  **writeTextResult(rows, fields)** - write query result to client. Rows and fields are in the same format as in `connection.query` callback.
  *  **writeColumns(fields)** - write fields + EOF packets.
  *  **writeTextRow(row)**  - write array (not hash!) ov values as result row
  *  TODO: binary protocol

events:

   *  **query(sql)** - query from client


## License

 MIT

## Acknowledgements

  - Internal protocol is written from scratch using my experience with [mysql-native](https://github.com/sidorares/nodejs-mysql-native)
  - constants, sql parameters interpolation, pool, connection config class taken from [node-mysql](https://github.com/felixge/node-mysql) (I tried to preserve git history)
  - SSL upgrade code based on @TooTallNate [code](https://gist.github.com/TooTallNate/848444)
  - Secure connection / compressed connection api flags compatible to [mariasql](https://github.com/mscdex/node-mariasql/) client.
  - [contributors](https://github.com/sidorares/node-mysql2/graphs/contributors)

## Benchmarks
  - see [node-mysql-benchmarks](https://github.com/mscdex/node-mysql-benchmarks)
  - try to run example [benchmarks](https://github.com/sidorares/node-mysql2/tree/master/benchmarks) on your system

## Examples using MySQL server API:

  - [Mysql-pg-proxy](https://github.com/sidorares/mysql-pg-proxy)  - mysql to postgres proxy server.
  - [Mysqlite.js](https://github.com/sidorares/mysqlite.js) - mysql server with JS-only (emscripten compiled) sqlite backend.
  - [sql-engine](https://github.com/eugeneware/sql-engine) - mysql server with leveldb backend.

## See also:

  - [wire protocol documentation](http://dev.mysql.com/doc/internals/en/client-server-protocol.html)
  - [node-mysql](https://github.com/felixge/node-mysql) - most popular node.js mysql client library
  - [node-mariasql](https://github.com/mscdex/node-mariasql/) - bindings to libmariasql. One of the fastest clients
  - [node-libmysqlclident](https://github.com/Sannis/node-mysql-libmysqlclient) - bindings to libmysqlclient
  - [mysql-co](https://github.com/sidorares/mysql-co) - wrappers to use mysql2 with generators and [co library](https://github.com/visionmedia/co)
  - [mysql-utilities](https://github.com/tshemsedinov/node-mysql-utilities) - useful utilities on top of mysql connection

## Contributing

Feel free to create pull requests.
TODO in order of importance:

  - node-mysql api incompatibility fixes
  - documentation
  - tests
  - benchmarks
  - bug fixes
  - TODOs in source code
  - performance improvements
  - features

## Features TODO
  - more server side commands support (binary protocol, etc)
  - named parameters interpolarion into unnamed parameters translation for prepared statements
