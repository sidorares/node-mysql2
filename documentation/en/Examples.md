# Examples

## Simple SELECT

```js
const mysql = require('mysql2');
const connection = mysql.createConnection({user: 'test', database: 'test'});

connection.query('SELECT 1+1 as test1', (err, rows) => {
  //
});
```

## Prepared statement and parameters

```js
const mysql = require('mysql2');
const connection = mysql.createConnection({user: 'test', database: 'test'});

connection.execute('SELECT 1+? as test1', [10], (err, rows) => {
  //
});
```

## Connecting over encrypted connection

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

You can use 'Amazon RDS' string as value to ssl property to connect to Amazon RDS mysql over ssl (in that case http://s3.amazonaws.com/rds-downloads/mysql-ssl-ca-cert.pem CA cert is used)

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


## Simple MySQL proxy server

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
      // overloaded args, either (err, result :object)
      // or (err, rows :array, columns :array)
      if (Array.isArray(arguments[1])) {
        // response to a 'select', 'show' or similar
        const rows = arguments[1], columns = arguments[2];
        console.log('rows', rows);
        console.log('columns', columns);
        conn.writeTextResult(rows, columns);
      } else {
        // response to an 'insert', 'update' or 'delete'
        const result = arguments[1];
        console.log('result', result);
        conn.writeOk(result);
      }
    });
  });

  conn.on('end', remote.end.bind(remote));
});
```

## Examples using MySQL server API

  - [MySQL-pg-proxy](https://github.com/sidorares/mysql-pg-proxy)  - MySQL to Postgres proxy server.
  - [MySQLite.js](https://github.com/sidorares/mysqlite.js) - MySQL server with JS-only (emscripten compiled) sqlite backend.
  - [SQL-engine](https://github.com/eugeneware/sql-engine) - MySQL server with LevelDB backend.
  - [MySQL-osquery-proxy](https://github.com/sidorares/mysql-osquery-proxy) - Connect to [facebook osquery](https://osquery.io/) using MySQL client
  - [PlyQL](https://github.com/implydata/plyql) - Connect to [Druid](http://druid.io/) using MySQL client
