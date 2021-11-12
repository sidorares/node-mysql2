# Documentation

## Introduction

`Node-MySQL2` aims to be a drop in replacement for [node-mysql](https://github.com/mysqljs/mysql). Please check `node-mysql` for full documentation.

**Note :** *If you see any API incompatibilities with `node-mysql`, please report via github issue.*

Not only `Node-MySQL2` offers better performance over `node-mysql`, we also support these additional features.

- [Prepared Statements](https://github.com/sidorares/node-mysql2/tree/master/documentation/Prepared-Statements.md)
- [Promise Wrapper](https://github.com/sidorares/node-mysql2/tree/master/documentation/Promise-Wrapper.md)
- [Authentication Switch](https://github.com/sidorares/node-mysql2/tree/master/documentation/Authentication-Switch.md)
- [More Features](https://github.com/sidorares/node-mysql2/tree/master/documentation/Extras.md)
- [MySQL Server](https://github.com/sidorares/node-mysql2/tree/master/documentation/MySQL-Server.md)
- Pooling
- SSL
- MySQL Compression
- Binary Log Protocol Client

## Examples

Please check these [examples](https://github.com/sidorares/node-mysql2/tree/master/documentation/Examples.md) for `node-mysql2`.


## Known incompatibilities with `node-mysql`

- `zeroFill` flag is ignored in type conversion.
You need to check corresponding field's zeroFill flag and convert to string manually if this is of importance to you.

- `DECIMAL` and `NEWDECIMAL` types always returned as `string` unless you pass this config option:
```javascript
{
  decimalNumbers: true
}
```
**Note :** *This option could lose precision on the number as Javascript Number is a Float!*

## Other Resources

  - [Wire protocol documentation](http://dev.mysql.com/doc/internals/en/client-server-protocol.html)
  - [node-mysql](https://github.com/mysqljs/mysql) - Most popular node.js mysql client library
  - [node-mariasql](https://github.com/mscdex/node-mariasql/) - Bindings to libmariasql. One of the fastest clients
  - [node-libmysqlclient](https://github.com/Sannis/node-mysql-libmysqlclient) - Bindings to libmysqlclient
  - [go-mysql](https://github.com/siddontang/go-mysql) - MySQL Go client (prepared statements, binlog protocol, server)

## Benchmarks
  - https://gist.github.com/sidorares/ffe9ee9c423f763e3b6b
  - `npm run benchmarks`
  - [node-mysql-benchmarks](https://github.com/mscdex/node-mysql-benchmarks)
  - try to run example [benchmarks](https://github.com/sidorares/node-mysql2/tree/master/benchmarks) on your system
