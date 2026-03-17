# MySQL2 — Type Architecture

Internal structure of the `.d.ts` files in `/typings`. This document describes how the types are organized, connected, and composed.

---

## 1. Mixin Pattern

The central pattern that powers the entire query/execute API. Both `Connection` and `Pool` get their `query()` and `execute()` methods from mixin functions, not direct declarations.

### How it works

`QueryableBase<T>(Base?)` and `ExecutableBase<T>(Base?)` are higher-order functions that take a base class constructor and return an extended class with query/execute method overloads.

```
QueryableBase<T>(Base?) → class with 4 overloads of query()
ExecutableBase<T>(Base?) → class with 4 overloads of execute()
```

### Callback versions (return `Query`)

Each method has 4 overloads: `(sql, cb?)`, `(sql, values, cb?)`, `(options, cb?)`, `(options, values, cb?)`.

- `typings/mysql/lib/protocol/sequences/QueryableBase.d.ts`
- `typings/mysql/lib/protocol/sequences/ExecutableBase.d.ts`

### Promise versions (return `Promise<[T, FieldPacket[]]>`)

Each method has 2 overloads: `(sql, values?)`, `(options, values?)`.

- `typings/mysql/lib/protocol/sequences/promise/QueryableBase.d.ts`
- `typings/mysql/lib/protocol/sequences/promise/ExecutableBase.d.ts`

### Who uses the mixins

| Class/Interface            | Mixin Usage                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `Connection` (callback)    | `extends QueryableBase(ExecutableBase(EventEmitter))`                        |
| `Pool` (callback)          | `extends QueryableBase(ExecutableBase(EventEmitter))`                        |
| `PoolCluster` (callback)   | `extends EventEmitter` directly — **does NOT use mixins**                    |
| `PoolNamespace` (callback) | interface extends `QueryableAndExecutableBase`                               |
| `Connection` (promise)     | `extends QueryableAndExecutableBase` (anonymous class composing both mixins) |
| `Pool` (promise)           | interface extends `Connection` (inherits mixins transitively)                |
| `PoolNamespace` (promise)  | interface extends `QueryableAndExecutableBase`                               |

### Helper type

```ts
type QueryableConstructor<T = object> = new (...args: any[]) => T;
```

Used as the constraint for mixin base class parameters.

---

## 2. Dual API (Callback vs Promise)

MySQL2 exposes two parallel APIs: callback-based and promise-based.

### Entry points

| API      | Entry File            | Primary Type Source             |
| -------- | --------------------- | ------------------------------- |
| Callback | `index.d.ts` (root)   | `typings/mysql/index.d.ts`      |
| Promise  | `promise.d.ts` (root) | declares promise classes inline |

### How promise wraps callback

1. `promise.d.ts` re-exports everything from `index.js` via `export * from './index.js'`
2. It imports the promise-specific mixin functions from `typings/mysql/lib/protocol/sequences/promise/`
3. It composes an anonymous `QueryableAndExecutableBase` class:
   ```ts
   declare class QueryableAndExecutableBase extends QueryableBaseClass(
     ExecutableBaseClass(EventEmitter)
   ) {}
   ```
4. Promise classes (`Connection`, `Pool`, etc.) extend or implement this base

### Key differences

| Aspect                       | Callback                      | Promise                       |
| ---------------------------- | ----------------------------- | ----------------------------- |
| `query()`/`execute()` return | `Query`                       | `Promise<[T, FieldPacket[]]>` |
| `createConnection()` return  | `Connection` (sync)           | `Promise<Connection>` (async) |
| `createPool()` return        | `Pool` (sync)                 | `Pool` (sync)                 |
| `end()`                      | `void` with optional callback | `Promise<void>`               |
| Resource disposal            | `Symbol.dispose` (sync)       | `Symbol.asyncDispose` (async) |
| `.promise()` method          | Available on callback classes | Not applicable                |

### Bridging

Callback classes have a `.promise()` method that returns the promise-wrapped version:

- `Connection.promise()` → `PromiseConnection`
- `Pool.promise()` → `PromisePool`
- `PoolConnection.promise()` → ⚠️ Currently typed as `PromisePool` (bug — should be `PromisePoolConnection`)

---

## 3. Class Hierarchy

### Callback

```
EventEmitter
├── Connection extends QueryableBase(ExecutableBase(EventEmitter))
│   ├── .config: ConnectionOptions
│   ├── .threadId: number
│   ├── .authorized: boolean
│   ├── .state: ConnectionState (readonly)
│   ├── .sequenceId: number
│   ├── static createQuery(): Query
│   ├── beginTransaction(), connect(), commit(), rollback()
│   ├── changeUser(), end(), destroy(), pause(), resume()
│   ├── escape(), escapeId(), format()
│   ├── prepare(), unprepare(), ping()
│   ├── serverHandshake(), writeOk(), writeError(), writeEof()
│   ├── writeTextResult(), writePacket()
│   ├── promise() → PromiseConnection
│   └── Symbol.dispose
│
│   └── PoolConnection extends Connection
│       ├── .connection: Connection
│       ├── release(): void
│       ├── promise() → PromisePool  ⚠️ (bug: should be PromisePoolConnection)
│       └── Symbol.dispose
│
├── Pool extends QueryableBase(ExecutableBase(EventEmitter))
│   ├── .config: PoolOptions
│   ├── getConnection(cb), releaseConnection(conn)
│   ├── end(cb?), unprepare(sql)
│   ├── promise() → PromisePool
│   ├── on: 'connection' | 'acquire' | 'release' | 'enqueue'
│   └── Symbol.dispose
│   ⚠️ Missing: escape(), escapeId(), format() (exist at runtime)
│
├── PoolCluster extends EventEmitter  (NO mixins)
│   ├── .config: PoolClusterOptions
│   ├── add(config), add(group, uri), add(group, config)
│   ├── remove(pattern), end(cb?)
│   ├── getConnection(cb), getConnection(group, cb), getConnection(group, selector, cb)
│   ├── of(pattern, selector?) → PoolNamespace
│   ├── on: 'online' | 'offline' | 'remove' | 'warn'
│   └── Symbol.dispose
│
├── Server extends EventEmitter
│   ├── .connections: Connection[]
│   ├── listen(port): Server
│   ├── close(callback): void
│   ⚠️ Missing: listen(port, cb) overload, close() without cb
│
└── Sequence extends EventEmitter
    ├── Query extends Sequence
    │   ├── .sql: string
    │   ├── start(), determinePacket(), stream()
    │   └── on: 'error' | 'fields' | 'result' | 'end'
    │
    └── Prepare extends Sequence
        ├── .sql: string
        ├── start(), determinePacket(), stream()
        └── on: 'error' | 'fields' | 'result' | 'end'

PoolNamespace (interface extends QueryableAndExecutableBase)
├── getConnection(cb)
```

### Promise

```
EventEmitter
├── Connection extends QueryableAndExecutableBase
│   ├── .config: ConnectionOptions
│   ├── .threadId: number
│   ├── .state: ConnectionState (readonly)
│   ├── connect(), ping(), beginTransaction(), commit(), rollback()
│   ├── changeUser(), prepare(), unprepare()
│   ├── end(), destroy(), pause(), resume()
│   ├── escape(), escapeId(), format()
│   └── Symbol.asyncDispose
│
│   └── PoolConnection extends Connection
│       ├── .connection: Connection
│       ├── release(): void
│       └── Symbol.asyncDispose
│
├── Pool (interface extends Connection)
│   ├── .pool: CorePool (callback Pool reference)
│   ├── getConnection() → Promise<PoolConnection>
│   ├── releaseConnection(conn)
│   ├── end() → Promise<void>
│   └── on: 'connection' | 'acquire' | 'release' | 'enqueue'
│
├── PoolCluster (interface extends EventEmitter)
│   ├── .config: PoolClusterOptions
│   ├── add(config), add(group, uri), add(group, config)
│   ├── end() → Promise<void>
│   ├── getConnection(), getConnection(group), getConnection(group, selector)
│   ├── of(pattern, selector?) → PoolNamespace
│   ├── on: 'remove' | 'warn'
│   ├── Symbol.asyncDispose
│   ⚠️ Missing: on 'online' | 'offline' (exist in callback version)
│   ⚠️ Missing: remove() method
│
└── PoolNamespace (interface extends QueryableAndExecutableBase)
    └── getConnection() → Promise<PoolConnection>
```

---

## 4. File Map

All type definition files, their purpose, and key exports.

### Root entry points

| File            | Purpose             | Key Exports                                                                                                                                                  |
| --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/index.d.ts`   | Root callback entry | Re-exports from `typings/mysql/index.js`                                                                                                                     |
| `/promise.d.ts` | Root promise entry  | `Connection`, `Pool`, `PoolConnection`, `PoolCluster`, `PoolNamespace`, `PreparedStatementInfo`, `createConnection()`, `createPool()`, `createPoolCluster()` |

### Main API (`typings/mysql/`)

| File         | Purpose          | Key Exports                                                                                                                                                          |
| ------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.d.ts` | Callback API hub | `createConnection()`, `createPool()`, `createPoolCluster()`, `createServer()`, `escape`, `escapeId`, `format`, `raw`, `ConnectionConfig`, re-exports all sub-modules |

### Core classes (`typings/mysql/lib/`)

| File                  | Purpose                    | Key Exports                                                                                                                                                                                      |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Connection.d.ts`     | Connection class + options | `Connection`, `ConnectionOptions` (40+ props), `SslOptions`, `ConnectionState`                                                                                                                   |
| `Pool.d.ts`           | Connection pool            | `Pool`, `PoolOptions`                                                                                                                                                                            |
| `PoolCluster.d.ts`    | Pool cluster               | `PoolCluster`, `PoolClusterOptions`, `PoolNamespace`                                                                                                                                             |
| `PoolConnection.d.ts` | Pool connection            | `PoolConnection`                                                                                                                                                                                 |
| `Server.d.ts`         | MySQL server (testing)     | `Server`                                                                                                                                                                                         |
| `Auth.d.ts`           | Auth plugins               | `AuthPlugin`, `authPlugins` (4 built-in plugins)                                                                                                                                                 |
| `Tracing.d.ts`        | diagnostics_channel        | `QueryTraceContext`, `ExecuteTraceContext`, `ConnectTraceContext`, `PoolConnectTraceContext`, `dc`, `hasTracingChannel`, `shouldTrace()`, `traceCallback()`, `tracePromise()`, channel variables |

### Protocol sequences (`typings/mysql/lib/protocol/sequences/`)

| File                  | Purpose                | Key Exports                                                                                                    |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Sequence.d.ts`       | Base class             | `Sequence` (extends EventEmitter, minimal)                                                                     |
| `Query.d.ts`          | Query sequence         | `Query`, `QueryOptions`, `QueryError`, `QueryValues`, `ExecuteValues`, `StreamOptions`, `QueryableConstructor` |
| `Prepare.d.ts`        | Prepare sequence       | `Prepare`, `PrepareStatementInfo`                                                                              |
| `ExecutableBase.d.ts` | Callback execute mixin | `ExecutableBase()`                                                                                             |
| `QueryableBase.d.ts`  | Callback query mixin   | `QueryableBase()`                                                                                              |

### Promise sequences (`typings/mysql/lib/protocol/sequences/promise/`)

| File                  | Purpose               | Key Exports        |
| --------------------- | --------------------- | ------------------ |
| `ExecutableBase.d.ts` | Promise execute mixin | `ExecutableBase()` |
| `QueryableBase.d.ts`  | Promise query mixin   | `QueryableBase()`  |

### Packets (`typings/mysql/lib/protocol/packets/`)

| File                            | Purpose                             | Key Exports                                             |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| `index.d.ts`                    | Packet hub                          | `QueryResult` (union type), re-exports all packet types |
| `OkPacket.d.ts`                 | OK result _(deprecated)_            | `OkPacket`                                              |
| `ResultSetHeader.d.ts`          | Result metadata                     | `ResultSetHeader`                                       |
| `RowDataPacket.d.ts`            | Data row                            | `RowDataPacket`                                         |
| `FieldPacket.d.ts`              | Column metadata                     | `FieldPacket`                                           |
| `Field.d.ts`                    | TypeCast field _(deprecated alias)_ | `Field` → `TypeCastField`                               |
| `ProcedurePacket.d.ts`          | Stored procedure result             | `ProcedureCallPacket<T>`                                |
| `params/OkPacketParams.d.ts`    | Server OK params                    | `OkPacketParams`                                        |
| `params/ErrorPacketParams.d.ts` | Server error params                 | `ErrorPacketParams`                                     |

### Constants (`typings/mysql/lib/constants/`)

| File                     | Purpose               | Key Exports                                                         |
| ------------------------ | --------------------- | ------------------------------------------------------------------- |
| `index.d.ts`             | Constants hub         | Re-exports Types, Charsets, CharsetToEncoding                       |
| `Types.d.ts`             | MySQL column types    | `Types` (hex codes 0x00-0xff + named: DECIMAL, TINY, ..., GEOMETRY) |
| `Charsets.d.ts`          | Charset/collation IDs | `Charsets` (270+ named entries)                                     |
| `CharsetToEncoding.d.ts` | Charset→encoding map  | `CharsetToEncoding` (string[])                                      |

### Parsers (`typings/mysql/lib/parsers/`)

| File               | Purpose         | Key Exports                                                                       |
| ------------------ | --------------- | --------------------------------------------------------------------------------- |
| `index.d.ts`       | Parsers hub     | Re-exports as `TypeCastField`, `TypeCastGeometry`, `TypeCastNext`, `TypeCastType` |
| `typeCast.d.ts`    | Type casting    | `TypeCast`, `Field` (= TypeCastField), `Geometry`, `Next`, `Type`                 |
| `ParserCache.d.ts` | Cache utilities | `setMaxParserCache()`, `clearParserCache()`                                       |

---

## 5. ConnectionOptions — Complete Property Map

All properties declared in `typings/mysql/lib/Connection.d.ts`.

### With JSDoc documentation

| Property                | Type                                                    | Default             | Description                          |
| ----------------------- | ------------------------------------------------------- | ------------------- | ------------------------------------ |
| `decimalNumbers`        | `boolean`                                               | `false`             | Return DECIMAL/NEWDECIMAL as numbers |
| `user`                  | `string`                                                | —                   | MySQL user                           |
| `password`              | `string`                                                | —                   | MySQL password                       |
| `password1`             | `string`                                                | —                   | Alias for password (MFA)             |
| `password2`             | `string`                                                | —                   | 2nd factor auth password             |
| `password3`             | `string`                                                | —                   | 3rd factor auth password             |
| `database`              | `string`                                                | —                   | Database name                        |
| `charset`               | `string`                                                | `'UTF8_GENERAL_CI'` | Connection charset/collation         |
| `host`                  | `string`                                                | `'localhost'`       | Database hostname                    |
| `port`                  | `number`                                                | `3306`              | Port number                          |
| `localAddress`          | `string`                                                | —                   | Source IP for TCP                    |
| `socketPath`            | `string`                                                | —                   | Unix socket path                     |
| `timezone`              | `Timezone`                                              | `'local'`           | Timezone for dates                   |
| `connectTimeout`        | `number`                                                | `10000`             | Connection timeout (ms)              |
| `stringifyObjects`      | `boolean`                                               | `false`             | Stringify objects in queries         |
| `insecureAuth`          | `boolean`                                               | `false`             | Allow old auth method                |
| `infileStreamFactory`   | `(path: string) => Readable`                            | —                   | Custom stream for LOAD DATA INFILE   |
| `typeCast`              | `TypeCast`                                              | `true`              | Column value conversion              |
| `queryFormat`           | `(query: string, values: any) => void`                  | —                   | Custom query format                  |
| `supportBigNumbers`     | `boolean`                                               | `false`             | Handle BIGINT/DECIMAL                |
| `bigNumberStrings`      | `boolean`                                               | `false`             | Return big numbers as strings        |
| `dateStrings`           | `boolean \| Array<'TIMESTAMP' \| 'DATETIME' \| 'DATE'>` | `false`             | Return dates as strings              |
| `debug`                 | `any`                                                   | `false`             | Print packets to stdout              |
| `trace`                 | `boolean`                                               | `true`              | Stack traces on errors               |
| `multipleStatements`    | `boolean`                                               | `false`             | Allow multiple statements            |
| `flags`                 | `Array<string>`                                         | —                   | Connection flags                     |
| `ssl`                   | `string \| SslOptions`                                  | —                   | SSL configuration                    |
| `rowsAsArray`           | `boolean`                                               | —                   | Return rows as arrays                |
| `enableKeepAlive`       | `boolean`                                               | `true`              | Socket keep-alive                    |
| `keepAliveInitialDelay` | `number`                                                | `0`                 | Keep-alive initial delay             |

### Without JSDoc documentation

| Property                | Type                                       | Notes                          |
| ----------------------- | ------------------------------------------ | ------------------------------ |
| `charsetNumber`         | `number`                                   | Numeric charset ID             |
| `compress`              | `boolean`                                  | Protocol compression           |
| `authSwitchHandler`     | `(data: any, callback: () => void) => any` | Auth switch handler            |
| `connectAttributes`     | `{ [param: string]: any }`                 | Connection attributes          |
| `isServer`              | `boolean`                                  | Server mode flag               |
| `maxPreparedStatements` | `number`                                   | LRU cache limit                |
| `namedPlaceholders`     | `boolean`                                  | Named placeholder support      |
| `nestTables`            | `boolean \| string`                        | Nest tables in results         |
| `passwordSha1`          | `string`                                   | Pre-hashed password            |
| `pool`                  | `any`                                      | Pool reference                 |
| `stream`                | `any`                                      | Custom stream                  |
| `uri`                   | `string`                                   | Connection URI                 |
| `connectionLimit`       | `number`                                   | ⚠️ Duplicated from PoolOptions |
| `maxIdle`               | `number`                                   | ⚠️ Duplicated from PoolOptions |
| `idleTimeout`           | `number`                                   | ⚠️ Duplicated from PoolOptions |
| `Promise`               | `any`                                      | Promise constructor            |
| `queueLimit`            | `number`                                   | ⚠️ Duplicated from PoolOptions |
| `waitForConnections`    | `boolean`                                  | ⚠️ Duplicated from PoolOptions |
| `disableEval`           | `boolean`                                  | Disable eval in parsers        |
| `authPlugins`           | `{ [key: string]: AuthPlugin }`            | Custom auth plugins            |
| `jsonStrings`           | `boolean`                                  | Force JSON as string           |
| `gracefulEnd`           | `boolean`                                  | Graceful pool end              |

### PoolOptions (extends ConnectionOptions)

Adds these properties with JSDoc (in `typings/mysql/lib/Pool.d.ts`):

| Property             | Type      | Default                   |
| -------------------- | --------- | ------------------------- |
| `waitForConnections` | `boolean` | `true`                    |
| `connectionLimit`    | `number`  | `10`                      |
| `maxIdle`            | `number`  | same as `connectionLimit` |
| `idleTimeout`        | `number`  | `60000`                   |
| `queueLimit`         | `number`  | `0`                       |

**Issue:** These properties are duplicated in `ConnectionOptions` without JSDoc. They should only exist in `PoolOptions`.

---

## 6. QueryOptions vs ConnectionOptions

### Shared options (override per-query)

These exist in both `ConnectionOptions` and `QueryOptions`, allowing per-query overrides:

| Option                | ConnectionOptions        | QueryOptions  |
| --------------------- | ------------------------ | ------------- |
| `typeCast`            | ✅                       | ✅            |
| `nestTables`          | ✅ (`boolean \| string`) | ✅ (`any` ⚠️) |
| `rowsAsArray`         | ✅                       | ✅            |
| `supportBigNumbers`   | ✅                       | ✅            |
| `bigNumberStrings`    | ✅                       | ✅            |
| `dateStrings`         | ✅                       | ✅            |
| `timezone`            | ✅                       | ✅            |
| `infileStreamFactory` | ✅                       | ✅            |
| `namedPlaceholders`   | ✅ (undocumented)        | ✅            |

### QueryOptions-only

| Option    | Type          | Description              |
| --------- | ------------- | ------------------------ |
| `sql`     | `string`      | The SQL query (required) |
| `values`  | `QueryValues` | Query parameter values   |
| `timeout` | `number`      | Operation timeout (ms)   |

### Not in QueryOptions but available at runtime

| Option             | Status                                                       |
| ------------------ | ------------------------------------------------------------ |
| `insertIdAsNumber` | Missing from both QueryOptions and ConnectionOptions typings |
| `decimalNumbers`   | Only in ConnectionOptions, not in QueryOptions               |
