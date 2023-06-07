# Extra Features

## Named placeholders

You can use named placeholders for parameters by setting `namedPlaceholders` config value or query/execute time option. Named placeholders are converted to unnamed `?` on the client (mysql protocol does not support named parameters). If you reference parameter multiple times under the same name it is sent to server multiple times. Unnamed placeholders can still be used by providing the values as an array instead of an object.

```js
connection.config.namedPlaceholders = true;
connection.execute('select :x + :y as z', { x: 1, y: 2 }, (err, rows) => {
  // statement prepared as "select ? + ? as z" and executed with [1,2] values
  // rows returned: [ { z: 3 } ]
});

connection.execute('select :x + :x as z', { x: 1 }, (err, rows) => {
  // select ? + ? as z, execute with [1, 1]
});

connection.query('select :x + :x as z', { x: 1 }, (err, rows) => {
  // query select 1 + 1 as z
});

// unnamed placeholders are still valid if the values are provided in an array
connection.query('select ? + ? as z', [1, 1], (err, rows) => {
  // query select 1 + 1 as z
});
```


## Receiving rows as array of columns instead of hash with column name as key:

```js
const options = { sql: 'select A,B,C,D from foo', rowsAsArray: true };
connection.query(options, (err, results) => {
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

## Sending tabular data with 'load infile' and local stream:

In addition to sending local fs files you can send any stream using `infileStreamFactory` query option. If set, it has to be a function that return a readable stream. It gets file path from query as a parameter.

Note: starting from version 2.0 `infileStreamFactory` is required parameter for `LOAD DATA LOCAL INFILE`. Response from server indicates that it wants access to a local file and no `infileStreamFactory` option is provided the query ends with error.

```js
// local file
connection.query(
  'LOAD DATA LOCAL INFILE "/tmp/data.csv" INTO TABLE test FIELDS TERMINATED BY ? (id, title)',
  onInserted1
);
// local stream
const sql =
  'LOAD DATA LOCAL INFILE "mystream" INTO TABLE test FIELDS TERMINATED BY ? (id, title)';
connection.query(
  {
    sql: sql,
    infileStreamFactory: function(path) {
      return getStream();
    }
  },
  onInserted2
);
```

## Connecting using custom stream:

```js
const net = require('net');
const mysql = require('mysql2');
const shape = require('shaper');
const connection = mysql.createConnection({
  user: 'test',
  database: 'test',
  stream: net.connect('/tmp/mysql.sock').pipe(shape(10)) // emulate 10 bytes/sec link
});
connection.query('SELECT 1+1 as test1', console.log);
```

`stream` also can be a function. In that case function result has to be duplex stream, and it is used for connection transport. This is required if you connect pool using custom transport as new pooled connection needs new stream. [Example](https://github.com/sidorares/node-mysql2/issues/80) connecting over socks5 proxy:

```js
const mysql = require('mysql2');
const SocksConnection = require('socksjs');
const pool = mysql.createPool({
  database: 'test',
  user: 'foo',
  password: 'bar',
  stream: function(cb) {
    const newStream = new SocksConnection(
      { host: 'remote.host', port: 3306 },
      { host: 'localhost', port: 1080 }
    );
    cb(null, newStream);
  }
});
```

In addition to password `createConnection()`, `createPool()` and `changeUser()` accept `passwordSha1` option. This is useful when implementing proxies as plaintext password might be not available.
