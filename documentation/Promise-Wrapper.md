# Promise wrappers

In addition to errback interface there is thin wrapper to expose Promise-based api

## Basic Promise

```js
   /* eslint-env es6 */
   var mysql = require('mysql2/promise'); // or require('mysql2').createConnectionPromise
   mysql.createConnection({ /* same parameters as for non-promise createConnection */ })
     .then((conn) => conn.query('select foo from bar'))
     .then(([rows, fields]) => console.log(rows[0].foo));
```

```js
    const pool = require('mysql2/promise').createPool({}); // or mysql.createPoolPromise({})
    pool.getConnection()
      .then((conn) => {
        const res = conn.query('select foo from bar');
        conn.release();
        return res;
      }).then((result) => {
        console.log(result[0][0].foo);
      }).catch((err) => {
        console.log(err); // any of connection time or query time errors from above
      });
```
## ES7 Async Await
```js
async function example1 () {
  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({ database: test });
  let [rows, fields] = await conn.execute('select ?+? as sum', [2, 2]);
}

async function example2 () {
   let mysql = require('mysql2/promise');
   let pool = mysql.createPool({database: test});
   // execute in parallel, next console.log in 3 seconds
   await Promise.all([pool.query('select sleep(2)'), pool.query('select sleep(3)')]);
   console.log('3 seconds after');
   await pool.end();
   await conn.end();
}
```

## With [CO](https://github.com/tj/co)
<!--eslint-disable-next-block-->
```js
var mysql = require('mysql2');
var co = require('co');
co(function * () {
  var c = yield mysql.createConnectionPromise({user: 'root', namedPlaceholders: true });
  var rows = yield c.query('show databases');
  console.log(rows);
  console.log(yield c.execute('select 1+:toAdd as qqq', {toAdd: 10}));
  yield c.end();
});
```
Examples in [/examples/promise-co-await](https://github.com/sidorares/node-mysql2/tree/master/examples/promise-co-await)
