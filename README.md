#node-mysql2

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]

Mysql client for node.js. Written in native JavaScript and aims to be mostly api compatible with [node-mysql](https://github.com/felixge/node-mysql)

[![NPM](https://nodei.co/npm/mysql2.png?downloads=true&stars=true)](https://nodei.co/npm/mysql2/)
[![NPM](https://nodei.co/npm-dl/mysql2.png?months=6)](https://nodei.co/npm/mysql2/)

## Features

 In addition to client-side query/escape and connection pooling

  - [fast](https://gist.github.com/sidorares/ffe9ee9c423f763e3b6b)
  - MySQL server API for proxies and mocks
  - SSL and compression
  - prepared statements
  - binlog protocol client

## Documentation

See [node-mysql](https://github.com/felixge/node-mysql) documentation. If you see api incompatibilities, please report via github issue.

Below is a list of extensions not supported by node-mysql:

### Named placeholders

You can use named placeholders for parameters by setting `namedPlaceholders` config value or query/execute time option. Named placeholders are converted to unnamed `?` on the client (mysql protocol does not support named parameters). If you reference parameter multiple times under the same name it is sent to server multiple times.

```js
   connection.config.namedPlaceholders = true;
   connection.execute('select :x + :y as z', { x: 1, y: 2}, function(err, rows) {
     // statement prepared as "select ? + ? as z" and executed with [1,2] values
     // rows returned: [ { z: 3 } ]
   });

   connection.execute('select :x + :x as z', { x: 1 }, function(err, rows) {
     // select ? + ? as z, execute with [1, 1]
   });

   connection.query('select :x + :x as z', { x: 1 }, function(err, rows) {
     // query select 1 + 1 as z
   });
```

### Prepared statements

#### Automatic creation, cached and re-used by connection

Similar to `connection.query()`.

```js
connection.execute('select 1 + ? + ? as result', [5, 6], function(err, rows) {
  // rows: [ { result: 12 } ]
  // internally 'select 1 + ? + ? as result' is prepared first. On subsequent calls cached statement is re-used
});

// close cached statement for 'select 1 + ? + ? as result'. noop if not in cache
connection.unprepare('select 1 + ? + ? as result');
```

#### Manual prepare / execute

```js
connection.prepare('select ? + ? as tests', function(err, statement) {
   // statement.parameters - array of column definitions, length === number of params, here 2
   // statement.columns - array of result column definitions. Can be empty if result schema is dynamic / not known
   // statement.id
   // statement.query

   statement.execute([1, 2], function(err, rows, columns) {
    // -> [ { tests: 3 } ]
   });

   // note that there is no callback here. There is no statement close ack at protocol level.
   statement.close();
});
```
Note that you should not use statement after connection reset (`changeUser()` or disconnect). Statement scope is connection, you need to prepare statement for each new connection in order to use it.

### Receiving rows as array of columns instead of hash with column name as key:

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

### Sending tabular data with 'load infile' and local stream:

In addition to sending local fs files you can send any stream using `infileStreamFactory` query option. If set, it has to be a function that return a readable stream. It gets file path from query as a parameter.

```js
// local file
connection.query('LOAD DATA LOCAL INFILE "/tmp/data.csv" INTO TABLE test FIELDS TERMINATED BY ? (id, title)', onInserted1);
// local stream
var sql = 'LOAD DATA LOCAL INFILE "mystream" INTO TABLE test FIELDS TERMINATED BY ? (id, title)';
connection.query({
  sql: sql,
  infileStreamFactory: function(path) { return getStream(); }
}, onInserted2);
```

### Connecting using custom stream:

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
`stream` also can be a function. In that case function result has to be duplex stream, and it is used for connection transport. This is required if you connect pool using custom transport as new pooled connection needs new stream. [Example](https://github.com/sidorares/node-mysql2/issues/80) connecting over socks5 proxy:

```js
var mysql      = require('mysql2');
var SocksConnection = require('socksjs');
var pool = mysql.createPool({
  database: 'test',
  user: 'foo',
  password: 'bar'
  stream: function(cb) {
    cb(null, new SocksConnection({ host: 'remote.host', port: 3306}, { host: 'localhost', port: 1080 }));
  }
 });
```

In addition to password `createConnection()`, `createPool()` and `changeUser()` accept `passwordSha1` option. This is useful when implementing proxies as plaintext password might be not available.

## Known incompatibilities with node-mysql

In contrast to node-mysql, `zeroFill` flag is ignored in type conversion.
You need to check corresponding field zeroFill flag and convert to string manually if this is of importance to you.

DECIMAL and NEWDECIMAL types always returned as string

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

```js
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
  - https://gist.github.com/sidorares/ffe9ee9c423f763e3b6b
  - `npm run benchmarks`
  - [node-mysql-benchmarks](https://github.com/mscdex/node-mysql-benchmarks)
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
  - [go-mysql](https://github.com/siddontang/go-mysql) - Mysql Go client (prepared statements, binlog protocol, server)

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

[npm-image]: https://img.shields.io/npm/v/mysql2.svg
[npm-url]: https://npmjs.org/package/mysql2
[node-version-image]: http://img.shields.io/node/v/mysql2.svg
[node-version-url]: http://nodejs.org/download/
[travis-image]: https://img.shields.io/travis/sidorares/node-mysql2/master.svg?label=linux
[travis-url]: https://travis-ci.org/sidorares/node-mysql2
[appveyor-image]: https://img.shields.io/appveyor/ci/sidorares/node-mysql2/master.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/sidorares/node-mysql2
[downloads-image]: https://img.shields.io/npm/dm/mysql2.svg
[downloads-url]: https://npmjs.org/package/mysql2
