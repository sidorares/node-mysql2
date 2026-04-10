# MySQL2 — Known Type Gaps

Occurrences of `@ts-expect-error: TODO: implement typings` across test files, categorized by root cause. These represent runtime APIs that work correctly but are not yet reflected in the `.d.ts` files in `/typings`.

To find the current count, run: `grep -r "TODO: implement typings" test/ | wc -l`

For the architecture and file map, see [`architecture.md`](architecture.md).

---

## Category 1: Pool Methods Missing

**Problem:** `Pool` inherits `query()` and `execute()` from the mixins but does not declare `escape()`, `escapeId()`, or `format()`, which exist at runtime in `lib/base/pool.js`.

**Affected typing file:** `typings/mysql/lib/Pool.d.ts`

**Runtime source:** `lib/base/pool.js` — delegates to `connection.escape()`, `connection.escapeId()`, `connection.format()`

**Gaps:**

- `pool.escape()` — not in Pool type
- `pool.escapeId()` — not in Pool type
- `pool.format()` — not in Pool type
- `mysql.createPoolPromise()` — factory function not typed

**Test files:**

- `test/integration/test-pool.test.mts`

**Fix:** Add `escape()`, `escapeId()`, and `format()` methods to the `Pool` class in `Pool.d.ts`, matching `Connection`'s signatures.

---

## Category 2: PrepareStatementInfo Incomplete

**Problem:** `PrepareStatementInfo` in `Prepare.d.ts` only declares `close()` and `execute()`. At runtime, it also exposes `.parameters`, `.columns`, and `.id`.

**Affected typing file:** `typings/mysql/lib/protocol/sequences/Prepare.d.ts`

**Runtime source:** `lib/commands/prepare.js` — the prepared statement object returned includes parameter definitions, column definitions, and the statement ID.

**Missing properties:**

- `.parameters` — array of column/parameter definitions
- `.columns` — array of column definitions
- `.id` — numeric statement ID

**Test files:**

- `test/global/integration/regressions/2052.test.mts`
- `test/integration/connection/test-prepare-simple.test.mts`

**Fix:** Add `parameters`, `columns`, and `id` properties to the `PrepareStatementInfo` class. Also update the promise version `PreparedStatementInfo` in `promise.d.ts`.

---

## Category 3: Server / createServer

**Problem:** The `Server` class and `createServer()` factory have incomplete type declarations.

**Affected typing files:**

- `typings/mysql/index.d.ts` — `createServer(handler)` requires a handler
- `typings/mysql/lib/Server.d.ts` — `listen(port)` missing callback overload, `close(callback)` missing no-argument overload

**Runtime source:** `lib/server.js`

**Gaps:**

- `mysql.createServer()` — runtime allows calling without arguments, type requires `handler`
- `server.listen(port, callback)` — type only accepts `(port: number)`, missing callback
- `server.close()` — type requires callback, runtime allows no arguments

**Test files:**

- `test/unit/pool-cluster/test-connection-error-remove.test.mts`
- `test/unit/pool-cluster/test-restore.test.mts`
- `test/unit/pool-cluster/test-restore-events.test.mts`
- `test/unit/pool-cluster/test-remove-by-name.test.mts`
- `test/unit/pool-cluster/test-remove-by-pattern.test.mts`
- `test/unit/pool-cluster/test-connection-retry.test.mts`
- `test/integration/connection/test-server-listen.test.mts`

**Fix:** Add overloads to `Server.listen()` and `Server.close()`, make `createServer()` handler optional.

---

## Category 4: Connection Options in Wrong Contexts

**Problem:** Some options exist in `ConnectionOptions` but don't flow correctly through certain API paths.

**Affected typing file:** `typings/mysql/lib/Connection.d.ts`

**Gaps:**

- `passwordSha1` in `changeUser()` — the option exists in `ConnectionOptions` and `changeUser()` accepts `ConnectionOptions`, but type inference doesn't work in some call patterns
- `uri` in `createPoolCluster()` — the option exists in `ConnectionOptions`

**Test files:**

- `test/global/integration/connection/test-change-user.test.mts`
- `test/global/integration/connection/test-change-user-plugin-auth.test.mts`
- `test/common.test.mts`

---

## Category 5: Auth Switch / Multi-Factor

**Problem:** Server-side connection handling and authentication flow types are incomplete. The auth plugin system works at runtime but the type declarations don't cover the full server-side handshake and auth switch protocol.

**Affected typing files:**

- `typings/mysql/lib/Connection.d.ts` — `serverHandshake()` parameter types too loose (`any`)
- `typings/mysql/lib/Auth.d.ts` — auth plugin chain types
- `typings/mysql/lib/Server.d.ts` — server connection events

**Gaps:**

- Server-side connection handler (`server.on('connection', conn => ...)`) — `conn` methods for auth flow not fully typed
- `conn.serverHandshake()` — accepts an object with auth plugin configuration, but parameter is typed as `any`
- Multi-factor auth callback chains not reflected in types
- Auth switch response handling gaps

**Test files:**

- `test/integration/test-auth-switch.test.mts`
- `test/integration/test-auth-switch-plugin-error.test.mts`
- `test/integration/test-auth-switch-plugin-async-error.test.mts`
- `test/integration/test-auth-switch-multi-factor.test.mts`
- `test/integration/connection/test-change-user-multi-factor.test.mts`

**Fix:** Properly type the `serverHandshake()` parameter object, add server-side connection event types, and type the auth plugin response chain.

---

## Category 6: Query Result Refinements

**Problem:** Some query-related properties and nested config access are not typed.

**Affected typing files:**

- `typings/mysql/lib/protocol/sequences/Query.d.ts` — `Query` class missing `.values`
- `typings/mysql/lib/Pool.d.ts` — `Pool.config` type doesn't expose nested `connectionConfig`

**Gaps:**

- `Query.values` — property exists at runtime but not in the `Query` class type (only `.sql` is declared)
- `pool.config.connectionConfig.namedPlaceholders` — nested config access not typed (Pool config is `PoolOptions`, which doesn't expose `connectionConfig` sub-object)

**Test files:**

- `test/integration/connection/test-named-placeholders.test.mts`
- `test/integration/connection/test-multiple-results.test.mts`

---

## Category 7: Stream / Error Handling

**Problem:** Connection stream access and certain error handling patterns are not typed.

**Affected typing file:** `typings/mysql/lib/Connection.d.ts`

**Gaps:**

- `connection.stream` — raw socket property not in the Connection type
- Error event handler types don't cover all error code patterns

**Test files:**

- `test/integration/connection/test-stream-errors.test.mts`

---

## Category 8: Promise Wrapper Access

**Problem:** Promise-wrapped connections expose a `.connection` property to access the underlying callback connection, but EventEmitter methods on that inner connection aren't properly accessible.

**Affected typing file:** `promise.d.ts`

**Gaps:**

- `conn.connection` — accessing the underlying callback connection from a promise wrapper
- `conn.connection.listenerCount()` — EventEmitter methods not inherited/exposed
- `conn.connection.emit()` — EventEmitter methods not inherited/exposed
- Various promise wrapper methods missing from type declarations

**Test files:**

- `test/integration/promise-wrappers/test-promise-wrappers.test.mts`

---

## Category 9: PoolCluster Promise Wrapper

**Problem:** The promise version of PoolCluster has incomplete method overloads.

**Affected typing file:** `promise.d.ts` (PoolCluster interface)

**Gaps:**

- `remove()` method missing from promise PoolCluster
- Event overloads incomplete (missing `'online'` and `'offline'`)
- Method signatures not covering all valid call patterns

**Test files:**

- `test/integration/pool-cluster/test-promise-wrapper.test.mts`

---

## Category 10: Miscellaneous

**Gaps:**

- `connection.close()` — not in Connection type (only `end()` and `destroy()` are declared). At runtime, `close()` exists as an alias.
- `pool.config.connectionConfig` — nested config structure not typed
- Various one-off type gaps in specific test scenarios

**Test files:**

- `test/global/integration/connection/test-backpressure-load-data-infile.test.mts`
- `test/integration/test-pool-connect-error.test.mts`
- `test/integration/config/test-connect-timeout.test.mts`
- `test/integration/test-server-close.test.mts`
- `test/integration/test-pool-memory-leak.test.mts`

---

## Confirmed Bugs in Current Types

These are not "missing types" but **incorrect types** that should be fixed:

### Bug 1: `PoolConnection.promise()` returns wrong type

**File:** `typings/mysql/lib/PoolConnection.d.ts`

**Current:** `promise(promiseImpl?: PromiseConstructor): PromisePool`

**Should be:** `promise(promiseImpl?: PromiseConstructor): PromisePoolConnection`

A pool connection's `.promise()` should return a promise-wrapped pool connection, not a promise pool.

### Bug 2: `QueryOptions.nestTables` typed as `any`

**File:** `typings/mysql/lib/protocol/sequences/Query.d.ts`

**Current:** `nestTables?: any`

**Should be:** `nestTables?: boolean | string`

The same property in `ConnectionOptions` is correctly typed as `boolean | string`.

### Bug 3: Pool options duplicated in ConnectionOptions

**File:** `typings/mysql/lib/Connection.d.ts`

**Problem:** `connectionLimit`, `maxIdle`, `idleTimeout`, `queueLimit`, `waitForConnections` are declared in both `ConnectionOptions` and `PoolOptions`. They should only exist in `PoolOptions` (which extends `ConnectionOptions`).

**Impact:** Any function accepting `ConnectionOptions` (like `createConnection()`) incorrectly accepts pool-specific options without TypeScript errors.

### Bug 4: Promise PoolCluster missing events

**Files:**

- `typings/mysql/lib/PoolCluster.d.ts`: declares `'online'` and `'offline'` events
- `promise.d.ts`: only declares `'remove'` and `'warn'` events

**Problem:** The promise version of PoolCluster is missing the `'online'` and `'offline'` event overloads that exist in the callback version.
