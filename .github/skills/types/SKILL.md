# MySQL2 — Typings Skill

Comprehensive reference for fixing TypeScript types in mysql2 `.mts` test files and guiding the `/lib` → TypeScript conversion. Trained on all `.d.ts` files in `/typings`.

For architecture details and the complete file map, see [`rules/architecture.md`](rules/architecture.md).
For the categorized list of known type gaps, see [`rules/gaps.md`](rules/gaps.md).

---

## 1. Public Type Inventory

These types are available via `import` or `import type` from the library. Always check this inventory before using `@ts-expect-error`.

### From `index.js` (callback API)

| Category    | Types                                                                                                                                          | Source (relative to `typings/mysql/`)                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Packets     | `RowDataPacket`, `ResultSetHeader`, `FieldPacket`, `OkPacket` _(deprecated)_, `Field` _(deprecated → TypeCastField)_, `ProcedureCallPacket<T>` | `lib/protocol/packets/*.d.ts`                           |
| Connection  | `Connection`, `ConnectionOptions` (40+ props), `ConnectionState`, `SslOptions`                                                                 | `lib/Connection.d.ts`                                   |
| Pool        | `Pool`, `PoolOptions` (extends ConnectionOptions), `PoolConnection`                                                                            | `lib/Pool.d.ts`, `lib/PoolConnection.d.ts`              |
| Cluster     | `PoolCluster`, `PoolClusterOptions`, `PoolNamespace`                                                                                           | `lib/PoolCluster.d.ts`                                  |
| Query       | `Query`, `QueryOptions`, `QueryError`, `QueryValues`, `ExecuteValues`, `StreamOptions`                                                         | `lib/protocol/sequences/Query.d.ts`                     |
| Prepare     | `Prepare`, `PrepareStatementInfo`                                                                                                              | `lib/protocol/sequences/Prepare.d.ts`                   |
| Parsers     | `TypeCast`, `TypeCastField`, `TypeCastGeometry`, `TypeCastNext`, `TypeCastType`                                                                | `lib/parsers/typeCast.d.ts`                             |
| Constants   | `Types`, `Charsets`, `CharsetToEncoding`                                                                                                       | `lib/constants/*.d.ts`                                  |
| Auth        | `AuthPlugin`, `authPlugins`                                                                                                                    | `lib/Auth.d.ts`                                         |
| Server      | `Server`, `OkPacketParams`, `ErrorPacketParams`                                                                                                | `lib/Server.d.ts`, `lib/protocol/packets/params/*.d.ts` |
| Tracing     | `QueryTraceContext`, `ExecuteTraceContext`, `ConnectTraceContext`, `PoolConnectTraceContext`                                                   | `lib/Tracing.d.ts`                                      |
| Utilities   | `escape()`, `escapeId()`, `format()`, `raw()`, `setMaxParserCache()`, `clearParserCache()`                                                     | `index.d.ts`                                            |
| SQL escaper | `Raw`, `SqlValue`, `Timezone`                                                                                                                  | re-export from `sql-escaper`                            |
| Factory     | `createConnection()`, `createPool()`, `createPoolCluster()`, `createServer()`                                                                  | `index.d.ts`                                            |
| Config      | `ConnectionConfig` (interface with static methods: `mergeFlags`, `getDefaultFlags`, `getCharsetNumber`, `getSSLProfile`, `parseUrl`)           | `index.d.ts`                                            |

### From `promise.js` (re-exports everything above + promise-specific)

| Type                                           | Difference vs Callback                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Connection`                                   | `.query()`/`.execute()` return `Promise<[T, FieldPacket[]]>` instead of `Query`        |
| `Pool` (interface extends Connection)          | `.getConnection()` returns `Promise<PoolConnection>`                                   |
| `PoolConnection` (extends Connection)          | has `release()` and `Symbol.asyncDispose`                                              |
| `PoolCluster` (interface extends EventEmitter) | `.getConnection()` returns `Promise<PoolConnection>`, `.end()` returns `Promise<void>` |
| `PoolNamespace` (interface)                    | `.getConnection()` returns `Promise<PoolConnection>`                                   |
| `PreparedStatementInfo`                        | `.execute()` returns `Promise<[T, FieldPacket[]]>`, `.close()` returns `Promise<void>` |
| `createConnection()`                           | returns `Promise<Connection>` (vs synchronous `Connection` in callback)                |
| `createPool()`                                 | returns `Pool` (synchronous, same as callback)                                         |
| `createPoolCluster()`                          | returns `PoolCluster` (synchronous, same as callback)                                  |

### Connection methods (callback-based)

- `.query(sql)`, `.query(sql, values)`, `.query(options)`, `.query(options, values)` — returns `Query`
- `.execute(sql)`, `.execute(sql, values)`, `.execute(options)`, `.execute(options, values)` — returns `Query`
- `.prepare(sql, callback?)` — returns `Prepare`
- `.unprepare(sql)` — returns `PrepareStatementInfo`
- `.connect(cb?)`, `.end(cb?)`, `.destroy()`, `.pause()`, `.resume()`, `.ping(cb?)`
- `.beginTransaction(cb)`, `.commit(cb?)`, `.rollback(cb)`, `.changeUser(options, cb?)`
- `.escape(value)`, `.escapeId(value)`, `.format(sql, values?)`
- `.promise(promiseImpl?)` — returns promise-wrapped connection

### Connection methods (server-side, on incoming connections)

- `.serverHandshake(args)` — initiate server handshake
- `.writeOk(params?: OkPacketParams)` — send OK packet
- `.writeError(params?: ErrorPacketParams)` — send error packet
- `.writeEof(warnings?, statusFlags?)` — send EOF packet
- `.writeTextResult(rows?, columns?)` — send result set
- `.writePacket(packet)` — send raw packet

### Union types

- `QueryResult` = `OkPacket | ResultSetHeader | ResultSetHeader[] | RowDataPacket[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket`
- `ConnectionState` = `'disconnected' | 'protocol_handshake' | 'connected' | 'authenticated' | 'error'`

---

## 2. Fixing Type Errors — Decision Tree

When you encounter a type error, classify it:

### 2.1. Library type exists → Use it (or let inference do it)

If the calling function already declares the callback signature in its type definition, **let TypeScript infer** the parameter types — do not annotate them redundantly:

```ts
// GOOD — types flow from .query()'s signature, no annotation needed
connection.query('SELECT 1', (err, rows, fields) => { ... });

// BAD — redundant annotations that duplicate what inference already provides
connection.query('SELECT 1', (err: QueryError | null, rows: RowDataPacket[]) => { ... });
```

Only add explicit annotations when inference **cannot** determine the type:

```ts
// Explicit annotation needed — typeCast callback type isn't fully inferred
import type { TypeCastField } from '../../index.js';
const conn = createConnection({
  typeCast: (field: TypeCastField) => field.string(),
});
```

For query/execute results in the promise API, generics are still needed:

```ts
import type { RowDataPacket } from '../../promise.js';
const [rows] = await connection.query<RowDataPacket[]>('SELECT 1');
```

### 2.2. API exists at runtime but has no/incomplete types → `@ts-expect-error: TODO: implement typings`

The API works but mysql2's `.d.ts` files don't declare it (or declare it incompletely). This marks work for library maintainers to add proper types in the future.

**Key principle**: if the code works at runtime but TypeScript complains (wrong arity, missing overloads, unrecognized properties, etc.), it's a **type definition gap**, not a code bug. Add `@ts-expect-error: TODO: implement typings` and preserve the original calling code exactly as-is. **Never** change working runtime code to satisfy a wrong type definition.

See [`rules/gaps.md`](rules/gaps.md) for the complete categorization of all known gaps.

```ts
// @ts-expect-error: TODO: implement typings
const server = mysql.createServer();

// @ts-expect-error: TODO: implement typings
server.listen(3307, () => {
  /* ... */
});
```

### 2.3. Accessing private/internal properties → `@ts-expect-error: internal access`

The code deliberately accesses internals that are **not part of the public API** and will **never** be typed. These are implementation details used in tests to verify internal state.

Common patterns:

- `connection._protocol` — internal protocol handler
- `connection._statements` — prepared statement cache
- `pool._freeConnections` — internal pool state
- `pool._allConnections` — internal pool tracking
- `connection.stream` — raw socket (partially typed)
- `connection._handshakePacket` — internal handshake data
- `packet._buf` — raw buffer access
- Any property starting with `_`

```ts
// @ts-expect-error: internal access
const protocol = connection._protocol;

// @ts-expect-error: internal access
assert.equal(pool._freeConnections.length, 0);
```

### 2.4. Test-local data structures → Define proper types

Shapes invented by the test itself that have no corresponding library type. Always define explicit `type` aliases (not `interface`) or inline type annotations.

```ts
// Define a type alias for the test-local structure
type DateTimeRow = RowDataPacket & {
  date: string | null;
  time: string | null;
  datetime: string | null;
};

const [rows] = await connection.query<DateTimeRow[]>(
  'SELECT date, time, datetime FROM test_table'
);

// For simple one-off shapes, extend RowDataPacket inline
const [rows] = await connection.query<(RowDataPacket & { count: number })[]>(
  'SELECT COUNT(*) as count FROM test_table'
);
```

---

## 3. Import Conventions

1. **`import type`** for type-only imports:

   ```ts
   import type { RowDataPacket, FieldPacket } from '../../promise.js';
   import type { TypeCastField, ConnectionOptions } from '../../index.js';
   ```

2. **`.mjs` extension** when importing other `.mts` files (TypeScript `NodeNext` resolves `.mjs` → `.mts`):

   ```ts
   import { createConnection } from '../../common.test.mjs';
   ```

3. **`.js` extension** for library imports (stays as-is):

   ```ts
   import mysql from '../../../index.js';
   import type { RowDataPacket } from '../../../promise.js';
   ```

---

## 4. Process

1. **Read** the target `.mts` file
2. **Run** `npx tsc --noEmit --pretty <file>` to get compiler errors
3. **Audit for `any` and `!`** — search the file for every occurrence of `any` (`: any`, `as any`, `<any>`, callback params typed as `any`) and every non-null assertion `!` (e.g., `fields![0]`). These are **just as important** as compiler errors. The tsconfig may have `noImplicitAny: false`, so `tsc` will NOT flag `any` — and `!` always compiles. You must find and fix both manually.
4. **Classify** each error, each `any`, and each `!` using the decision tree above
5. **Fix** them one by one:
   - Remove `any` from callback parameters — if the calling function has proper typings, just remove the annotation and let inference work (e.g., `(err: any, result: any) =>` → `(err, result) =>`)
   - Replace `any` in variable declarations with the correct type
   - Replace `!` (non-null assertion) with `?.` (optional chaining) — e.g., `fields![0].name` → `fields?.[0].name`
   - Add missing `import type` statements
   - Add generics to `.query<T>()` / `.execute<T>()`
   - Add `// @ts-expect-error: TODO: implement typings` for missing library types
   - Add `// @ts-expect-error: internal access` for private/internal property access
   - Define proper `type` aliases for test-local structures
6. **Re-run** `npx tsc --noEmit --pretty <file>` to verify no compiler errors
7. **Re-audit for `any` and `!`** — grep the file one more time to confirm zero remaining occurrences
8. **Done** only when all three checks pass: zero compiler errors, zero `any` annotations, and zero `!` non-null assertions

---

## 5. Fixing `any` in Callbacks

When the calling function has proper type definitions, **remove the annotations entirely** and let inference work:

| Pattern with `any`                   | Fix                   |
| ------------------------------------ | --------------------- |
| `(err: any, result: any)`            | `(err, result)`       |
| `(err: any, rows: any)`              | `(err, rows)`         |
| `(err: any, rows: any, fields: any)` | `(err, rows, fields)` |
| `(err: any, connection: any)`        | `(err, connection)`   |
| `(err: any)`                         | `(err)`               |

Only add explicit type annotations when inference fails (e.g., the calling function lacks typings or the callback is standalone).

---

## 6. Common Pitfalls

- **NEVER use `any`** — this is the #1 rule. Every `: any`, `as any`, `<any>` must be eliminated. The tsconfig's `noImplicitAny: false` means `tsc` won't catch these, so you must audit manually.
- **Don't add redundant type annotations** — if the type flows from the calling function's signature, let TypeScript infer it.
- **NEVER use `!` (non-null assertion)** — use optional chaining (`?.`) instead. `fields![0].name` is a hack; `fields?.[0].name` is safe access.
- **Don't trust `tsc` alone** — a file that compiles cleanly can still be full of `any` and `!`. Always audit manually.
- **Don't use `@ts-expect-error` when a library type exists** — always check the inventory above first.
- **Don't use `TODO: implement typings` for internal access** — use `internal access` instead; the distinction matters for tracking what needs library-level fixes vs what's intentionally private.
- **Don't add `@ts-expect-error` for test-local type mismatches** — define proper `type` aliases or inline types.
- **Always type fully** — define `type` aliases (not `interface`) with `RowDataPacket &` for query results, use generics on `.query<T>()` / `.execute<T>()`, and type all test-local structures explicitly.
- **Prefer `type` over `interface`** — for test-local structures, always use `type X = RowDataPacket & { ... }` instead of `interface X extends RowDataPacket { ... }`.
- **Don't forget `import type`** — use `import type { X }` when `X` is only used as a type annotation.
- **Don't use `.mts` in import specifiers** — TypeScript expects `.mjs` even for `.mts` source files.
- **When fixing a type gap in `/typings`** — always verify consistency across both callback (`typings/mysql/index.d.ts`) and promise (`promise.d.ts`) APIs. Changes to `QueryableBase`/`ExecutableBase` affect Connection, Pool, and PoolNamespace simultaneously.

---

## 7. References

- [`rules/architecture.md`](rules/architecture.md) — mixin pattern, dual API, class hierarchy, file map, ConnectionOptions
- [`rules/gaps.md`](rules/gaps.md) — known type gaps categorized, confirmed bugs
