## Node MySQL 2

[![Greenkeeper badge](https://badges.greenkeeper.io/sidorares/node-mysql2.svg)](https://greenkeeper.io/)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![License][license-image]][license-url]

[English](../..) | 简体中文 | [Português (BR)](../pt-br/)

> 适用于Node.js的MySQL客户端，专注于性能优化。支持SQL预处理、非UTF-8编码支持、二进制文件编码支持、压缩和SSL等等 [查看更多](../en)。

__目录__

  - [MySQL2的历史以及选择原因](#MySQL2的历史以及选择原因)
  - [安装](#安装)
  - [查询数据](#查询数据)
  - [SQL预处理的使用](#SQL预处理的使用)
  - [连接池的使用](#连接池的使用)
  - [Promise封装](#Promise封装)
  - [结果返回](#结果返回)
    - [连接级别](#连接级别)
    - [查询级别](#查询级别)
  - [API配置项](#API配置项)
  - [文档](#文档)
  - [鸣谢](#鸣谢)
  - [贡献](#贡献)

## MySQL2的历史以及选择原因

MySQL2 项目是 [MySQL-Native][mysql-native] 的延续。 协议解析器代码从头开始重写，api 更改为匹配流行的 [mysqljs/mysql][node-mysql]。 MySQL2 团队正在与 [mysqljs/mysql][node-mysql] 团队合作，将共享代码分解并移至 [mysqljs][node-mysql] 组织下。

MySQL2 大部分 API 与 [mysqljs][node-mysql] 兼容，并支持大部分功能。 MySQL2 还提供了更多的附加功能：

 - 更快、更好的性能
 - [支持预处理](../en/Prepared-Statements.md)
 - MySQL二进制日志协议
 - [MySQL Server](../en/MySQL-Server.md)
 -  对编码和排序规则有很好的支持
 - [Promise封装](../en/Promise-Wrapper.md)
 - 支持压缩
 - SSL 和 [Authentication Switch](../en/Authentication-Switch.md)
 - [自定义流](../en/Extras.md)
 - [连接池](#using-connection-pools)

## 安装

MySQL2 可以跨平台使用，毫无疑问可以安装在 Linux、Mac OS 或 Windows 上。

```bash
npm install --save mysql2
```

## 查询数据

```js
// 导入模块
const mysql = require('mysql2');

// 创建一个数据库连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test'
});

// 简单查询
connection.query(
  'SELECT * FROM `table` WHERE `name` = "Page" AND `age` > 45',
  function(err, results, fields) {
    console.log(results); // 结果集
    console.log(fields); // 额外的元数据（如果有的话）
  }
);

// 使用占位符
connection.query(
  'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
  ['Page', 45],
  function(err, results) {
    console.log(results);
  }
);
```

## SQL预处理的使用

使用 MySQL2，您还可以提前准备好SQL预处理语句。 使用准备好的SQL预处理语句，MySQL 不必每次都为相同的查询做准备，这会带来更好的性能。 如果您不知道为什么它们很重要，请查看这些讨论：

- [如何防止预处理语句SQL注入攻击](http://stackoverflow.com/questions/8263371/how-can-prepared-statements-protect-from-sql-injection-attacks)

MySQL2 提供了 `execute` 辅助函数，它将准备和查询语句。 您还可以使用 `prepare` / `unprepare` 方法手动准备/取消准备。

```js
// 导入模块
const mysql = require('mysql2');

// 创建一个数据库连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test'
});

// execute 将在内部调用 prepare 和 query
connection.execute(
  'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
  ['Rick C-137', 53],
  function(err, results, fields) {
    console.log(results); // 结果集
    console.log(fields); // 额外元数据（如果有）

    // 如果再次执行相同的语句，他将从缓存中选取
    // 这能有效的节省准备查询时间获得更好的性能
  }
);
```

## 连接池的使用

连接池通过重用以前的连接来帮助减少连接到 MySQL 服务器所花费的时间，当你完成它们时让它们保持打开而不是关闭。

这改善了查询的延迟，因为您避免了建立新连接所带来的所有开销。

```js
// 导入模块
const mysql = require('mysql2');

// 创建连接池，设置连接池的参数
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```
该池不会预先创建所有连接，而是根据需要创建它们，直到达到连接限制。

您可以像直接连接一样使用池（使用 `pool.query()` 和 `pool.execute()`）：
```js
// For pool initialization, see above
pool.query("SELECT `field` FROM `table`", function(err, rows, fields) {
  // Connection is automatically released when query resolves
});
```

或者，也可以手动从池中获取连接并稍后返回：
```js
// For pool initialization, see above
pool.getConnection(function(err, conn) {
  // Do something with the connection
  conn.query(/* ... */);
  // Don't forget to release the connection when finished!
  pool.releaseConnection(conn);
});
```

## Promise封装

MySQL2 也支持 Promise API。 这与 ES7 异步等待非常有效。
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

MySQL2 使用范围内可用的默认 `Promise` 对象。 但是你可以选择你想使用的 `Promise` 实现。
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

MySQL2 还在 Pools 上公开了一个 .promise()函数，因此您可以从同一个池创建一个 promise/non-promise 连接。
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

MySQL2 在 Connections 上公开了一个 .promise*()函数，以“升级”现有的 non-promise 连接以使用 Promise。
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

## 结果返回

如果你有两个相同名称的列，你可能希望以数组而不是对象的形式获取结果，为了防止冲突，这是与 [Node MySQL][node-mysql] 库的区别。

例如： `select 1 as foo, 2 as foo`.

您可以在连接级别（适用于所有查询）或查询级别（仅适用于该特定查询）启用此设置。

### 连接级别
```js
const con = mysql.createConnection(
  { host: 'localhost', database: 'test', user: 'root', rowsAsArray: true }
);
```

### 查询级别
```js
con.query({ sql: 'select 1 as foo, 2 as foo', rowsAsArray: true }, function(err, results, fields) {
  console.log(results) // 返回数组而不是数组对象
  console.log(fields) // 无变化
});
```

## API配置项

MySQL2大部分的API与 [Node MySQL][node-mysql] 基本上相同，你应该查看他们的API文档来知道更多的API选项。

如果您发现与 [Node MySQL][node-mysql] 的任何不兼容问题，请通过`issue`报告。 我们将优先修复报告的不兼容问题。

## 文档

你可以在[这里](../en)获得更多的详细文档，并且你应该查阅各种代码[示例](../en/examples)来获得更高级的概念。

## 鸣谢

  - 内部协议由@sidorares编写 [MySQL-Native](https://github.com/sidorares/nodejs-mysql-native)
  - 常量、SQL参数插值、连接池、`ConnectionConfig` 类取自[node-mysql](https://github.com/mysqljs/mysql)
  - 基于@TooTallNate的SSL代码升级[代码地址](https://gist.github.com/TooTallNate/848444)
  - 与[MariaSQL](https://github.com/mscdex/node-mariasql/)客户端兼容安全连接/压缩连接 API。
  - [贡献者](https://github.com/sidorares/node-mysql2/graphs/contributors)

## 贡献

如果要为`node-mysql2`做些贡献.请查阅 [Contributing.md](https://github.com/sidorares/node-mysql2/blob/master/Contributing.md) 来获得更多详细信息。


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
