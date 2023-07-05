## MySQL 2

[![Greenkeeper badge](https://badges.greenkeeper.io/sidorares/node-mysql2.svg)](https://greenkeeper.io/)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![License][license-image]][license-url]  

English | [简体中文](./documentation/zh-cn/) | [Português (BR)](./documentation/pt-br/)

> MySQL client for Node.js with focus on performance. Supports prepared statements, non-utf8 encodings, binary log protocol, compression, ssl [much more](./documentation/en).

__Table of contents__

  - [History and Why MySQL2](#history-and-why-mysql2)
  - [Installation](#installation)
  - [First Query](#first-query)
  - [Using Prepared Statements](#using-prepared-statements)
  - [Using connection pools](#using-connection-pools)
  - [Using Promise Wrapper](#using-promise-wrapper)
  - [Array Results](#array-results)
    - [Connection Level](#connection-level)
    - [Query Level](#query-level)
  - [API and Configuration](#api-and-configuration)
  - [Documentation](#documentation)
  - [Acknowledgements](#acknowledgements)
  - [Contributing](#contributing)

## History and Why MySQL2

MySQL2 project is a continuation of [MySQL-Native][mysql-native]. Protocol parser code was rewritten from scratch and api changed to match popular [mysqljs/mysql][node-mysql]. MySQL2 team is working together with [mysqljs/mysql][node-mysql] team to factor out shared code and move it under [mysqljs][node-mysql] organisation.

MySQL2 is mostly API compatible with [mysqljs][node-mysql] and supports majority of features. MySQL2 also offers these additional features:

 - Faster / Better Performance
 - [Prepared Statements](./documentation/en/Prepared-Statements.md)
 - MySQL Binary Log Protocol
 - [MySQL Server](./documentation/en/MySQL-Server.md)
 - Extended support for Encoding and Collation
 - [Promise Wrapper](./documentation/en/Promise-Wrapper.md)
 - Compression
 - SSL and [Authentication Switch](./documentation/en/Authentication-Switch.md)
 - [Custom Streams](./documentation/en/Extras.md)
 - [Pooling](#using-connection-pools)

## Installation

MySQL2 is free from native bindings and can be installed on Linux, Mac OS or Windows without any issues.

```bash
npm install --save mysql2
```

## First Query
```js
// get the client
const mysql = require('mysql2');

// create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test'
});

// simple query
connection.query(
  'SELECT * FROM `table` WHERE `name` = "Page" AND `age` > 45',
  function(err, results, fields) {
    console.log(results); // results contains rows returned by server
    console.log(fields); // fields contains extra meta data about results, if available
  }
);

// with placeholder
connection.query(
  'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
  ['Page', 45],
  function(err, results) {
    console.log(results);
  }
);
```

## Using Prepared Statements

With MySQL2 you also get the prepared statements. With prepared statements MySQL doesn't have to prepare plan for same query every time, this results in better performance. If you don't know why they are important, please check these discussions:

- [How prepared statements can protect from SQL Injection attacks](http://stackoverflow.com/questions/8263371/how-can-prepared-statements-protect-from-sql-injection-attacks)

MySQL2 provides `execute` helper which will prepare and query the statement. You can also manually prepare / unprepare statement with `prepare` / `unprepare` methods.

```js
// get the client
const mysql = require('mysql2');

// create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test'
});

// execute will internally call prepare and query
connection.execute(
  'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
  ['Rick C-137', 53],
  function(err, results, fields) {
    console.log(results); // results contains rows returned by server
    console.log(fields); // fields contains extra meta data about results, if available

    // If you execute same statement again, it will be picked from a LRU cache
    // which will save query preparation time and give better performance
  }
);
```

## Using connection pools

Connection pools help reduce the time spent connecting to the MySQL server by reusing a previous connection, leaving them open instead of closing when you are done with them.

This improves the latency of queries as you avoid all of the overhead that comes with establishing a new connection.

```js
// get the client
const mysql = require('mysql2');

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```
The pool does not create all connections upfront but creates them on demand until the connection limit is reached.

You can use the pool in the same way as connections (using `pool.query()` and `pool.execute()`):
```js
// For pool initialization, see above
pool.query("SELECT `field` FROM `table`", function(err, rows, fields) {
  // Connection is automatically released when query resolves
});
```

Alternatively, there is also the possibility of manually acquiring a connection from the pool and returning it later:
```js
// For pool initialization, see above
pool.getConnection(function(err, conn) {
  // Do something with the connection
  conn.query(/* ... */);
  // Don't forget to release the connection when finished!
  pool.releaseConnection(conn);
});
```

## Using Promise Wrapper

MySQL2 also support Promise API. Which works very well with ES7 async await.
```js
async function main() {
  // get the client
  const mysql = require('mysql2/promise');
  // create the connection
  const connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'test'});
  // query database
  const [rows, fields] = await connection.execute('SELECT * FROM `table` WHERE `name` = ? AND `age` > ?', ['Morty', 14]);
}
```

MySQL2 use default `Promise` object available in scope. But you can choose which `Promise` implementation you want to use.
```js
// get the client
const mysql = require('mysql2/promise');

// get the promise implementation, we will use bluebird
const bluebird = require('bluebird');

// create the connection, specify bluebird as Promise
const connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'test', Promise: bluebird});

// query database
const [rows, fields] = await connection.execute('SELECT * FROM `table` WHERE `name` = ? AND `age` > ?', ['Morty', 14]);
```

MySQL2 also exposes a .promise() function on Pools, so you can create a promise/non-promise connections from the same pool.
```js
async function main() {
  // get the client
  const mysql = require('mysql2');
  // create the pool
  const pool = mysql.createPool({host:'localhost', user: 'root', database: 'test'});
  // now get a Promise wrapped instance of that pool
  const promisePool = pool.promise();
  // query database using promises
  const [rows,fields] = await promisePool.query("SELECT 1");
}
```

MySQL2 exposes a .promise() function on Connections, to "upgrade" an existing non-promise connection to use promise.
```js
// get the client
const mysql = require('mysql2');
// create the connection
const con = mysql.createConnection(
  {host:'localhost', user: 'root', database: 'test'}
);
con.promise().query("SELECT 1")
  .then( ([rows,fields]) => {
    console.log(rows);
  })
  .catch(console.log)
  .then( () => con.end());
```

## Array Results

If you have two columns with the same name, you might want to get results as an array rather than an object to prevent them from clashing. This is a deviation from the [Node MySQL][node-mysql] library.

For example: `select 1 as foo, 2 as foo`.

You can enable this setting at either the connection level (applies to all queries), or at the query level (applies only to that specific query).

### Connection Level
```js
const con = mysql.createConnection(
  { host: 'localhost', database: 'test', user: 'root', rowsAsArray: true }
);
```

### Query Level
```js
con.query({ sql: 'select 1 as foo, 2 as foo', rowsAsArray: true }, function(err, results, fields) {
  console.log(results); // in this query, results will be an array of arrays rather than an array of objects
  console.log(fields); // fields are unchanged
});
```

## API and Configuration

MySQL2 is mostly API compatible with [Node MySQL][node-mysql]. You should check their API documentation to see all available API options.

One known incompatibility is that `DECIMAL` values are returned as strings whereas in [Node MySQL][node-mysql] they are returned as numbers. This includes the result of `SUM()` and `AVG()` functions when applied to `INTEGER` arguments. This is done deliberately to avoid loss of precision - see https://github.com/sidorares/node-mysql2/issues/935.

If you find any other incompatibility with [Node MySQL][node-mysql], Please report via Issue tracker. We will fix reported incompatibility on priority basis.

## Documentation

You can find more detailed documentation [here](./documentation/en). You should also check various code [examples](./examples) to understand advanced concepts.

## Acknowledgements

  - Internal protocol is written by @sidorares [MySQL-Native](https://github.com/sidorares/nodejs-mysql-native)
  - Constants, SQL parameters interpolation, Pooling, `ConnectionConfig` class taken from [node-mysql](https://github.com/mysqljs/mysql)
  - SSL upgrade code based on @TooTallNate [code](https://gist.github.com/TooTallNate/848444)
  - Secure connection / compressed connection api flags compatible to [MariaSQL](https://github.com/mscdex/node-mariasql/) client.
  - [Contributors](https://github.com/sidorares/node-mysql2/graphs/contributors)

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
[license-url]: https://github.com/sidorares/node-mysql2/blob/master/License
[license-image]: https://img.shields.io/npm/l/mysql2.svg?maxAge=2592000
[node-mysql]: https://github.com/mysqljs/mysql
[mysql-native]: https://github.com/sidorares/nodejs-mysql-native
