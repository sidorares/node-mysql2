# MySQL2 — Known Type Gaps

Every occurrence of `@ts-expect-error: TODO: implement typings` across the test files, grouped by root cause. Each one is a runtime API that works correctly and is not yet reflected in the `.d.ts` files in `/typings`.

For the current count, run `grep -r "TODO: implement typings" test/ | wc -l`.

[`architecture.md`](architecture.md) marks where each of these sits in the type structure.

---

## Category 1: Pool Methods Missing

**Problem:** `Pool` inherits `query()` and `execute()` from the mixins, but the escaping and formatting helpers it exposes at runtime are absent from its type.

**Affected typing file:** `typings/mysql/lib/Pool.d.ts`

**Runtime source:** `lib/base/pool.js`, which delegates to `connection.escape()`, `connection.escapeId()`, and `connection.format()`

**Gaps:**

- `pool.escape()`
- `pool.escapeId()`
- `pool.format()`
- `mysql.createPoolPromise()`, a factory function with no type at all

**Test files:**

- `test/integration/test-pool.test.mts`

**Fix:** Add `escape()`, `escapeId()`, and `format()` to the `Pool` class in `Pool.d.ts`, matching the signatures on `Connection`.

---

## Category 2: PrepareStatementInfo Incomplete

**Problem:** `PrepareStatementInfo` declares only `close()` and `execute()`, while the runtime object carries more.

**Affected typing file:** `typings/mysql/lib/protocol/sequences/Prepare.d.ts`

**Runtime source:** `lib/commands/prepare.js`

**Missing properties:**

- `.parameters`: the column and parameter definitions
- `.columns`: the column definitions
- `.id`: the numeric statement ID

**Test files:**

- `test/global/integration/regressions/2052.test.mts`
- `test/integration/connection/test-prepare-simple.test.mts`

**Fix:** Add the three properties to `PrepareStatementInfo`, then mirror the change on the promise version `PreparedStatementInfo` in `promise.d.ts`.

---

## Category 3: Server / createServer

**Problem:** The `Server` class and the `createServer()` factory declare narrower signatures than the runtime accepts.

**Affected typing files:**

- `typings/mysql/index.d.ts`
- `typings/mysql/lib/Server.d.ts`

**Runtime source:** `lib/server.js`

**Gaps:**

- `mysql.createServer()`: the runtime allows no arguments, the type requires a `handler`
- `server.listen(port, callback)`: the type accepts `(port: number)` only
- `server.close()`: the runtime allows no arguments, the type requires a callback

**Test files:**

- `test/unit/pool-cluster/test-connection-error-remove.test.mts`
- `test/unit/pool-cluster/test-restore.test.mts`
- `test/unit/pool-cluster/test-restore-events.test.mts`
- `test/unit/pool-cluster/test-remove-by-name.test.mts`
- `test/unit/pool-cluster/test-remove-by-pattern.test.mts`
- `test/unit/pool-cluster/test-connection-retry.test.mts`
- `test/integration/connection/test-server-listen.test.mts`

**Fix:** Add the overloads to `Server.listen()` and `Server.close()`, and make the `createServer()` handler optional.

---

## Category 4: Connection Options in Wrong Contexts

**Problem:** Some options are declared in `ConnectionOptions` but do not flow through every API path that accepts them.

**Affected typing file:** `typings/mysql/lib/Connection.d.ts`

**Gaps:**

- `passwordSha1` in `changeUser()`: `changeUser()` accepts `ConnectionOptions`, yet inference fails on some call patterns
- `uri` in `createPoolCluster()`: the option is declared in `ConnectionOptions` but does not reach this path

**Test files:**

- `test/global/integration/connection/test-change-user.test.mts`
- `test/global/integration/connection/test-change-user-plugin-auth.test.mts`
- `test/common.test.mts`

---

## Category 5: Auth Switch / Multi-Factor

**Problem:** The auth plugin system works at runtime, but the declarations do not cover the server-side handshake or the auth switch protocol.

**Affected typing files:**

- `typings/mysql/lib/Connection.d.ts`
- `typings/mysql/lib/Auth.d.ts`
- `typings/mysql/lib/Server.d.ts`

**Gaps:**

- The server-side connection handler, `server.on('connection', conn => ...)`: the auth flow methods on `conn` are not fully typed
- `conn.serverHandshake()`: takes an object with auth plugin configuration, typed as `any`
- Multi-factor auth callback chains are absent from the types
- Auth switch response handling is incomplete

**Test files:**

- `test/integration/test-auth-switch.test.mts`
- `test/integration/test-auth-switch-plugin-error.test.mts`
- `test/integration/test-auth-switch-plugin-async-error.test.mts`
- `test/integration/test-auth-switch-multi-factor.test.mts`
- `test/integration/connection/test-change-user-multi-factor.test.mts`

**Fix:** Type the `serverHandshake()` parameter object, add the server-side connection event types, and type the auth plugin response chain.

---

## Category 6: Query Result Refinements

**Problem:** A query property and a nested config path have no declarations.

**Affected typing files:**

- `typings/mysql/lib/protocol/sequences/Query.d.ts`
- `typings/mysql/lib/Pool.d.ts`

**Gaps:**

- `Query.values`: exists at runtime, while the `Query` class declares `.sql` only
- `pool.config.connectionConfig.namedPlaceholders`: `Pool.config` is a `PoolOptions`, which exposes no `connectionConfig` sub-object

**Test files:**

- `test/integration/connection/test-named-placeholders.test.mts`
- `test/integration/connection/test-multiple-results.test.mts`

---

## Category 7: Stream / Error Handling

**Problem:** Connection stream access and some error handling patterns have no declarations.

**Affected typing file:** `typings/mysql/lib/Connection.d.ts`

**Gaps:**

- `connection.stream`: the raw socket property is absent from the `Connection` type
- Error event handler types do not cover every error code pattern

**Test files:**

- `test/integration/connection/test-stream-errors.test.mts`

---

## Category 8: Promise Wrapper Access

**Problem:** A promise-wrapped connection exposes `.connection` to reach the underlying callback connection, but the EventEmitter surface of that inner connection is unreachable through the types.

**Affected typing file:** `promise.d.ts`

**Gaps:**

- `conn.connection`: reaching the underlying callback connection from a promise wrapper
- `conn.connection.listenerCount()` and `conn.connection.emit()`: EventEmitter methods neither inherited nor exposed
- Assorted promise wrapper methods absent from the declarations

**Test files:**

- `test/integration/promise-wrappers/test-promise-wrappers.test.mts`

---

## Category 9: PoolCluster Promise Wrapper

**Problem:** The promise version of `PoolCluster` declares fewer members than the callback version.

**Affected typing file:** `promise.d.ts` (PoolCluster interface)

**Reference:** `typings/mysql/lib/PoolCluster.d.ts` declares the full callback surface, including the `'online'` and `'offline'` events

**Gaps:**

- `remove()` is absent
- The `'online'` and `'offline'` event overloads are absent
- The remaining method signatures do not cover every valid call pattern

**Test files:**

- `test/integration/pool-cluster/test-promise-wrapper.test.mts`

---

## Category 10: Miscellaneous

**Gaps:**

- `connection.close()`: exists at runtime as an alias, while the `Connection` type declares `end()` and `destroy()` only
- `pool.config.connectionConfig`: the nested config structure has no type
- One-off gaps specific to a single test

**Test files:**

- `test/global/integration/connection/test-backpressure-load-data-infile.test.mts`
- `test/integration/test-pool-connect-error.test.mts`
- `test/integration/config/test-connect-timeout.test.mts`
- `test/integration/test-server-close.test.mts`
- `test/integration/test-pool-memory-leak.test.mts`

---

## Confirmed Bugs in Current Types

These are wrong types, not missing ones.

### Bug 1: `PoolConnection.promise()` returns the wrong type

**File:** `typings/mysql/lib/PoolConnection.d.ts`

**Current:** `promise(promiseImpl?: PromiseConstructor): PromisePool`

**Should be:** `promise(promiseImpl?: PromiseConstructor): PromisePoolConnection`

A pool connection wrapped in a promise is a promise pool connection, not a promise pool.

### Bug 2: `QueryOptions.nestTables` typed as `any`

**File:** `typings/mysql/lib/protocol/sequences/Query.d.ts`

**Current:** `nestTables?: any`

**Should be:** `nestTables?: boolean | string`

The same property in `ConnectionOptions` already carries the correct type.

### Bug 3: Pool options duplicated in ConnectionOptions

**File:** `typings/mysql/lib/Connection.d.ts`

**Problem:** `connectionLimit`, `maxIdle`, `idleTimeout`, `queueLimit`, and `waitForConnections` are declared in both `ConnectionOptions` and `PoolOptions`. Since `PoolOptions` extends `ConnectionOptions`, they belong in `PoolOptions` alone.

**Impact:** Every function taking a `ConnectionOptions`, `createConnection()` among them, accepts pool-specific options without a TypeScript error.
