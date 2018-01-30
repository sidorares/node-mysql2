# Prepared statements

## Automatic creation, cached and re-used by connection

Similar to `connection.query()`.

```js
connection.execute('select 1 + ? + ? as result', [5, 6], function (err, rows) {
  // rows: [ { result: 12 } ]
  // internally 'select 1 + ? + ? as result' is prepared first. On subsequent calls cached statement is re-used
});

// close cached statement for 'select 1 + ? + ? as result'. noop if not in cache
connection.unprepare('select 1 + ? + ? as result');
```

## Manual prepare / execute

```js
connection.prepare('select ? + ? as tests', function (err, statement) {
  // statement.parameters - array of column definitions, length === number of params, here 2
  // statement.columns - array of result column definitions. Can be empty if result schema is dynamic / not known
  // statement.id
  // statement.query

  statement.execute([1, 2], function (err, rows, columns) {
    // -> [ { tests: 3 } ]
  });

  // note that there is no callback here. There is no statement close ack at protocol level.
  statement.close();
});
```
Note that you should not use statement after connection reset (`changeUser()` or disconnect). Statement scope is connection, you need to prepare statement for each new connection in order to use it.

# Configuration

`maxPreparedStatements` : We keep the cached statements in a [lru-cache](https://github.com/isaacs/node-lru-cache). Default size is `16000` but you can use this option to override it. Any statements that are dropped from cache will be `closed`.

# Serialization of bind parameters

The bind parameter values passed to `execute` are serialized JS -> MySQL as:

* `null` -> `NULL`
* `number` -> `DOUBLE`
* `boolean` -> `TINY` (0 for false, 1 for true)
* `object` -> depending on prototype:
  * `Date` -> `DATETIME`
  * `JSON` like object - `JSON`
  * `Buffer` -> `VAR_STRING`
* Other -> `VAR_STRING`

Passing in `undefined` or a `function` will result in an error.