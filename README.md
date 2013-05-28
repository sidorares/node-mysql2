#node-mysql2

[![Build Status](https://secure.travis-ci.org/sidorares/node-mysql2.png)](http://travis-ci.org/sidorares/node-mysql2) [![](https://badge.fury.io/js/mysql2.png)](https://npmjs.org/package/mysql2) [![](https://gemnasium.com/sidorares/node-mysql2.png)](https://gemnasium.com/npms/mysql2) [TODO](https://github.com/cainus/node-coveralls): [![](https://coveralls.io/repos/sidorares/node-mysql2/badge.png)](https://coveralls.io/r/sidorares/node-mysql2)


Mysql client for node.js. Written in native JavaScript and aims to be mostly api compatible with [node-mysql](https://github.com/felixge/node-mysql)

## Installation

    npm install mysql2

## Features

 In addition to client-side query/escape and connection pooling

  - MySQL server API for proxies and mocks
  - SSL and compression
  - prepared statements

## Documentation

See [node-mysql](https://github.com/felixge/node-mysql) documentation. If you see api incompatibilities, please report via github issue.

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
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff
  });
  
  var remote = mysql.createConnection({user: 'root', database: 'test'});
  conn.on('query', function(sql) {
    console.log('proxying query:' + sql);    
    if (sql.match(/^select/i) || sql.match(/^show/i)) {
      // handle select and show queries
      remote.query(sql, function(err, rows, columns) {
        console.log('rows', rows);
        console.log('columns', columns);
        conn.writeTextResult(rows, columns);
      });
    } else {
      // handle other queries
      remote.query(sql, function(err, result) {
        console.log('result', result);
        conn.writeOk({affectedRows:result.affectedRows,insertId:result.insertId});
      });
    }

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
  - mysql-postgres bridge example
  - mysql-mongo bridge example using js-based sql parser
