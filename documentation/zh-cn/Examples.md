# 示例

## SELECT 例子

```js
const mysql = require('mysql2');
const connection = mysql.createConnection({user: 'test', database: 'test'});

connection.query('SELECT 1+1 as test1', (err, rows) => {
  //
});
```

## 预处理和参数

```js
const mysql = require('mysql2');
const connection = mysql.createConnection({user: 'test', database: 'test'});

connection.execute('SELECT 1+? as test1', [10], (err, rows) => {
  //
});
```

## 加密连接

```js
const fs = require('fs');
const mysql = require('mysql2');
const connection = mysql.createConnection({
  user: 'test',
  database: 'test',
  ssl: {
    key: fs.readFileSync('./certs/client-key.pem'),
    cert: fs.readFileSync('./certs/client-cert.pem')
  }
});
connection.query('SELECT 1+1 as test1', console.log);
```

您可以使用“Amazon RDS”字符串作为 ssl 属性的值，以通过 SSL 连接到 Amazon RDS MySQL (在这种情况下下将使用此 http://s3.amazonaws.com/rds-downloads/mysql-ssl-ca-cert.pem CA 证书)

```js
const mysql = require('mysql2');
const connection = mysql.createConnection({
  user: 'foo',
  password: 'bar',
  host: 'db.id.ap-southeast-2.rds.amazonaws.com',
  ssl: 'Amazon RDS'
});

connection.query('show status like \'Ssl_cipher\'', (err, res) => {
  console.log(err, res);
  connection.end();
});
```


## MySQL代理服务器示例

```js
const mysql = require('mysql2');

const server = mysql.createServer();
server.listen(3307);
server.on('connection', conn => {
  console.log('connection');

  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff
  });

  conn.on('field_list', (table, fields) => {
    console.log('field list:', table, fields);
    conn.writeEof();
  });

  const remote = mysql.createConnection({user: 'root', database: 'dbname', host:'server.example.com', password: 'secret'});

  conn.on('query', sql => {
    console.log(`proxying query: ${sql}`);
    remote.query(sql, function (err) {
      // 重载函数，也可以使用 (err, result :object)
      // 或者 (err, rows :array, columns :array)
      if (Array.isArray(arguments[1])) {
        // 对'select', 'show' 或类似的内容响应
        const rows = arguments[1], columns = arguments[2];
        console.log('rows', rows);
        console.log('columns', columns);
        conn.writeTextResult(rows, columns);
      } else {
        // 对 'insert', 'update' or 'delete' 进行响应
        const result = arguments[1];
        console.log('result', result);
        conn.writeOk(result);
      }
    });
  });

  conn.on('end', remote.end.bind(remote));
});
```

## MySQL 服务器 API 示例

  - [MySQL-pg-proxy](https://github.com/sidorares/mysql-pg-proxy)  - MySQL ot Postgres proxy server.
  - [MySQLite.js](https://github.com/sidorares/mysqlite.js) - MySQL server with JS-only (emscripten compiled) sqlite backend.
  - [SQL-engine](https://github.com/eugeneware/sql-engine) - MySQL server with LevelDB backend.
  - [MySQL-osquery-proxy](https://github.com/sidorares/mysql-osquery-proxy) - Connect to [facebook osquery](https://osquery.io/) using MySQL client
  - [PlyQL](https://github.com/implydata/plyql) - Connect to [Druid](http://druid.io/) using MySQL client
