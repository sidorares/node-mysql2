#node-mysql2

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]

MySql client for node.js. Written in native JavaScript and aims to be mostly api compatible with [node-mysql](https://github.com/felixge/node-mysql)

[![NPM](https://nodei.co/npm/mysql2.png?downloads=true&stars=true)](https://nodei.co/npm/mysql2/)
[![NPM](https://nodei.co/npm-dl/mysql2.png?months=6)](https://nodei.co/npm/mysql2/)

## Features

 In addition to client-side query/escape and connection pooling

  - [Fast](https://gist.github.com/sidorares/ffe9ee9c423f763e3b6b)
  - MySQL server API for proxies and mocks
  - SSL and compression
  - Prepared statements
  - Binary log protocol client

## Documentation


## Known incompatibilities with node-mysql

In contrast to node-mysql, `zeroFill` flag is ignored in type conversion.
You need to check corresponding field zeroFill flag and convert to string manually if this is of importance to you.

DECIMAL and NEWDECIMAL types always returned as string unless you pass this config option:
```javascript
{
  decimalNumbers: true
}
```
**_Warning this option could lose precision on the number as Javascript Number is a Float!_**

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
  *  **writeTextRow(row)**  - write array (not hash!) of values as result row
  *  TODO: binary protocol

events:

Every command packet received by the server will be emitted as a **packet** event with the parameters:

  * packet: Packet - The packet itself
  * knownCommand: boolean - is this command known to the server
  * commandCode: number - the parsed command code (first byte)

In addition special events are emitted for [commands](https://dev.mysql.com/doc/internals/en/text-protocol.html) received from the client. If no listener is present a fallback behavior will be invoked.

  *  **quit**() - Default: close the connection
  *  **init_db**(schemaName: string) - Default: return OK
  *  **query**(sql: string) - Please attach a listener to this. Default: return HA_ERR_INTERNAL_ERROR
  *  **field_list**(table: string, fields: string) - Default: return ER_WARN_DEPRECATED_SYNTAX
  *  **ping**() - Default: return OK

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
  - [sql-engine](https://github.com/eugeneware/sql-engine) - mysql server with LevelDB backend.
  - [mysql-osquery-proxy](https://github.com/sidorares/mysql-osquery-proxy) - connect to [facebook osquery](https://osquery.io/) using MySQL client
  - [PlyQL](https://github.com/implydata/plyql) - connect to [Druid](http://druid.io/) using MySQL client

## See also:

  - [wire protocol documentation](http://dev.mysql.com/doc/internals/en/client-server-protocol.html)
  - [node-mysql](https://github.com/felixge/node-mysql) - most popular node.js mysql client library
  - [node-mariasql](https://github.com/mscdex/node-mariasql/) - bindings to libmariasql. One of the fastest clients
  - [node-libmysqlclident](https://github.com/Sannis/node-mysql-libmysqlclient) - bindings to libmysqlclient
  - [go-mysql](https://github.com/siddontang/go-mysql) - Mysql Go client (prepared statements, binlog protocol, server)

## Contributing

Want to improve something in `node-mysql2`. Please check [Contributing.md](https://github.com/sidorares/node-mysql2/blob/master/Contributing.md) for detailed instruction on how to get started.


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
