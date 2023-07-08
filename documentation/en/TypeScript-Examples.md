# Using MySQL2 with TypeScript

## Installation
```bash
npm install --save mysql2
npm install --save-dev @types/node
```

> The `@types/node` ensure the proper interaction between **TypeScript** and the **Node.js** modules used by **MySQL2** (*net*, *events*, *stream*, *tls*, etc.).

## Import
You can import **MySQL2** in two ways:
```ts
import * as mysql from 'mysql2';
import * as mysql from 'mysql2/promise';

// By setting the `esModuleInterop` option to `true` in `tsconfig.json`
import mysql from 'mysql2';
import mysql from 'mysql2/promise';
```

## Connection
```ts
import mysql, { ConnectionOptions } from 'mysql2';

const access: ConnectionOptions = {
  user: 'test',
  database: 'test',
};

const conn = mysql.createConnection(access);
```

## Pool Connection
```ts
import mysql, { PoolOptions } from 'mysql2';

const access: PoolOptions = {
  user: 'test',
  database: 'test',
};

const conn = mysql.createPool(access);
```

## Query and Execute
### A simple SELECT
```ts
conn.query('SELECT 1 + 1 AS `test`;', (_err, rows) => {
  /**
   * @rows: [ { test: 2 } ]
   */
});
```

The `rows` output will be these possible types:
- `RowDataPacket[]`
- `RowDataPacket[][]`
- `ResultSetHeader`
- `ProcedureCallPacket`
- `OkPacket`
- `OkPacket[]`

In this example, you need to manually check the output types

---

### Type Specification
#### RowDataPacket[]
An array with the returned rows, for example:
```ts
import mysql, { RowDataPacket } from 'mysql2';

const conn = mysql.createConnection({
  user: 'test',
  database: 'test',
});

conn.query<RowDataPacket[]>('SELECT 1 + 1 AS `test`;', (_err, rows) => {
  console.log(rows);
  /**
   * @rows: [ { test: 2 } ]
   */
});
```

---

#### RowDataPacket[][]
- `rowsAsArray`
  ```ts
  import mysql, { RowDataPacket } from 'mysql2';

  const conn = mysql.createConnection({
    user: 'test',
    database: 'test',
    rowsAsArray: true,
  });

  const sql = `
    SELECT 1 + 1 AS test, 2 + 2 AS test;
  `;

  conn.query<RowDataPacket[][]>(sql, (_err, rows) => {
    console.log(rows);
    /**
    * @rows: [ [ 2, 4 ] ]
    */
  });
  ```

- `multipleStatements` with multiple queries
  ```ts
  import mysql, { RowDataPacket } from 'mysql2';

  const conn = mysql.createConnection({
    user: 'test',
    database: 'test',
    multipleStatements: true,
  });

  const sql = `
    SELECT 1 + 1 AS test;
    SELECT 2 + 2 AS test;
  `;

  conn.query<RowDataPacket[][]>(sql, (_err, rows) => {
    console.log(rows);
    /**
    * @rows: [ [ { test: 2 } ], [ { test: 4 } ] ]
    */
  });
  ```

#### ResultSetHeader
> In progress

#### ProcedureCallPacket
> In progress

#### OkPacket
> In progress

#### OkPacket[]
> In progress

---

## Examples

You can also check various code examples using **MySQL2** and **TypeScript** to understand advanced concepts:
> In progress

- Extending and using **Interfaces** with `RowDataPacket`.
- Checking for `ResultSetHeader` or `RowDataPacket[]` using **Procedure Calls**
- Checking for `ResultSetHeader` or `RowDataPacket[][]` using **Procedure Calls**
- Creating a custom **MySQL2** **Class**
