---
name: types
description: 'Fix a TypeScript error in a `.mts` test file, remove an `any` or a `!`, decide between `@ts-expect-error: internal access` and `@ts-expect-error: TODO: implement typings`, or change a `.d.ts` file under `/typings`. Carries the public type inventory, the decision tree, the type architecture, and every known typing gap.'
argument-hint: Optionally name the test file or the type to fix, or leave empty
user-invocable: true
---

# MySQL2 — Typings Skill

Reference for fixing TypeScript types in `.mts` test files, and for guiding the conversion of `/lib` to TypeScript.

For how the types are organized, connected, and composed, see [`rules/architecture.md`](rules/architecture.md).
For the categorized list of known type gaps, see [`rules/gaps.md`](rules/gaps.md).

---

## 1. Public type inventory

Every type below is importable from the library. Check this inventory before reaching for `@ts-expect-error`.

### From `index.js` (callback API)

| Category    | Types                                                                                                                                               | Source (relative to `typings/mysql/`)                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Packets     | `RowDataPacket`, `ResultSetHeader`, `FieldPacket`, `OkPacket` _(deprecated)_, `Field` _(deprecated, now `TypeCastField`)_, `ProcedureCallPacket<T>` | `lib/protocol/packets/*.d.ts`                           |
| Connection  | `Connection`, `ConnectionOptions` (40+ props), `ConnectionState`, `SslOptions`                                                                      | `lib/Connection.d.ts`                                   |
| Pool        | `Pool`, `PoolOptions` (extends ConnectionOptions), `PoolConnection`                                                                                 | `lib/Pool.d.ts`, `lib/PoolConnection.d.ts`              |
| Cluster     | `PoolCluster`, `PoolClusterOptions`, `PoolNamespace`                                                                                                | `lib/PoolCluster.d.ts`                                  |
| Query       | `Query`, `QueryOptions`, `QueryError`, `QueryValues`, `ExecuteValues`, `StreamOptions`                                                              | `lib/protocol/sequences/Query.d.ts`                     |
| Prepare     | `Prepare`, `PrepareStatementInfo`                                                                                                                   | `lib/protocol/sequences/Prepare.d.ts`                   |
| Parsers     | `TypeCast`, `TypeCastField`, `TypeCastGeometry`, `TypeCastNext`, `TypeCastType`                                                                     | `lib/parsers/typeCast.d.ts`                             |
| Constants   | `Types`, `Charsets`, `CharsetToEncoding`                                                                                                            | `lib/constants/*.d.ts`                                  |
| Auth        | `AuthPlugin`, `authPlugins`                                                                                                                         | `lib/Auth.d.ts`                                         |
| Server      | `Server`, `OkPacketParams`, `ErrorPacketParams`                                                                                                     | `lib/Server.d.ts`, `lib/protocol/packets/params/*.d.ts` |
| Tracing     | `QueryTraceContext`, `ExecuteTraceContext`, `ConnectTraceContext`, `PoolConnectTraceContext`                                                        | `lib/Tracing.d.ts`                                      |
| Utilities   | `escape()`, `escapeId()`, `format()`, `raw()`, `setMaxParserCache()`, `clearParserCache()`                                                          | `index.d.ts`                                            |
| SQL escaper | `Raw`, `SqlValue`, `Timezone`                                                                                                                       | re-export from `sql-escaper`                            |
| Factory     | `createConnection()`, `createPool()`, `createPoolCluster()`, `createServer()`                                                                       | `index.d.ts`                                            |
| Config      | `ConnectionConfig` (interface with static methods: `mergeFlags`, `getDefaultFlags`, `getCharsetNumber`, `getSSLProfile`, `parseUrl`)                | `index.d.ts`                                            |

### From `promise.js`

Re-exports everything above, with these differences:

| Type                                           | Difference vs callback                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Connection`                                   | `.query()`/`.execute()` return `Promise<[T, FieldPacket[]]>` instead of `Query`        |
| `Pool` (interface extends Connection)          | `.getConnection()` returns `Promise<PoolConnection>`                                   |
| `PoolConnection` (extends Connection)          | has `release()` and `Symbol.asyncDispose`                                              |
| `PoolCluster` (interface extends EventEmitter) | `.getConnection()` returns `Promise<PoolConnection>`, `.end()` returns `Promise<void>` |
| `PoolNamespace` (interface)                    | `.getConnection()` returns `Promise<PoolConnection>`                                   |
| `PreparedStatementInfo`                        | `.execute()` returns `Promise<[T, FieldPacket[]]>`, `.close()` returns `Promise<void>` |
| `createConnection()`                           | returns `Promise<Connection>`, against a synchronous `Connection` in the callback API  |
| `createPool()`                                 | returns `Pool` synchronously, same as the callback API                                 |
| `createPoolCluster()`                          | returns `PoolCluster` synchronously, same as the callback API                          |

### Connection methods (callback-based)

- `.query(sql)`, `.query(sql, values)`, `.query(options)`, `.query(options, values)` return `Query`.
- `.execute(sql)`, `.execute(sql, values)`, `.execute(options)`, `.execute(options, values)` return `Query`.
- `.prepare(sql, callback?)` returns `Prepare`.
- `.unprepare(sql)` returns `PrepareStatementInfo`.
- `.promise(promiseImpl?)` returns the promise-wrapped connection.
- `.connect(cb?)`, `.end(cb?)`, `.destroy()`, `.pause()`, `.resume()`, `.ping(cb?)`.
- `.beginTransaction(cb)`, `.commit(cb?)`, `.rollback(cb)`, `.changeUser(options, cb?)`.
- `.escape(value)`, `.escapeId(value)`, `.format(sql, values?)`.

### Connection methods (server-side, on incoming connections)

- `.serverHandshake(args)` initiates the server handshake.
- `.writeOk(params?: OkPacketParams)` sends an OK packet.
- `.writeError(params?: ErrorPacketParams)` sends an error packet.
- `.writeEof(warnings?, statusFlags?)` sends an EOF packet.
- `.writeTextResult(rows?, columns?)` sends a result set.
- `.writePacket(packet)` sends a raw packet.

### Union types

- `QueryResult` = `OkPacket | ResultSetHeader | ResultSetHeader[] | RowDataPacket[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket`
- `ConnectionState` = `'disconnected' | 'protocol_handshake' | 'connected' | 'authenticated' | 'error'`

---

## 2. Decision tree for type errors

Classify the error before fixing it.

### 2.1. The library type exists

When the calling function already declares the callback signature, let TypeScript infer the parameter types instead of annotating them again.

```ts
// ✅ Correct: the types flow from the .query() signature
connection.query('SELECT 1', (err, rows, fields) => { ... });

// ❌ Wrong: annotations that duplicate what inference already provides
connection.query('SELECT 1', (err: QueryError | null, rows: RowDataPacket[]) => { ... });
```

This is the fix for every `any` on a callback parameter. Remove the annotation, do not replace it:

| Pattern with `any`                   | Fix                   |
| ------------------------------------ | --------------------- |
| `(err: any, result: any)`            | `(err, result)`       |
| `(err: any, rows: any)`              | `(err, rows)`         |
| `(err: any, rows: any, fields: any)` | `(err, rows, fields)` |
| `(err: any, connection: any)`        | `(err, connection)`   |
| `(err: any)`                         | `(err)`               |

Annotate explicitly only where inference cannot reach, such as a standalone callback or a calling function without typings:

```ts
import type { TypeCastField } from '../../index.js';

const conn = createConnection({
  typeCast: (field: TypeCastField) => field.string(),
});
```

Query and execute results in the promise API still need their generic:

```ts
import type { RowDataPacket } from '../../promise.js';

const [rows] = await connection.query<RowDataPacket[]>('SELECT 1');
```

### 2.2. The API exists at runtime, the types do not

The call works, but `/typings` declares it incompletely or not at all. Mark it with `@ts-expect-error: TODO: implement typings`, which flags the work for a later typings fix.

Working runtime code that TypeScript rejects is a typings gap, never a code bug. Wrong arity, a missing overload, an unrecognized property: all of them mean the declaration is behind the implementation. Add the comment and leave the call exactly as it was. Never rewrite working code to satisfy a wrong type definition.

```ts
// @ts-expect-error: TODO: implement typings
const server = mysql.createServer();

// @ts-expect-error: TODO: implement typings
server.listen(3307, () => {
  /* ... */
});
```

Every known gap is categorized in [`rules/gaps.md`](rules/gaps.md).

### 2.3. The property is internal

The test deliberately reaches for an implementation detail that sits outside the public API and will never be typed. Mark it with `@ts-expect-error: internal access`.

Anything starting with `_` qualifies: `connection._protocol`, `connection._statements`, `connection._handshakePacket`, `pool._freeConnections`, `pool._allConnections`, `packet._buf`. So does `connection.stream`, the raw socket, despite the missing underscore.

```ts
// @ts-expect-error: internal access
const protocol = connection._protocol;

// @ts-expect-error: internal access
assert.equal(pool._freeConnections.length, 0);
```

### 2.4. The shape belongs to the test

A structure the test invents, with no library type behind it. Declare a `type` alias, never an `interface`, or annotate it inline.

```ts
type DateTimeRow = RowDataPacket & {
  date: string | null;
  time: string | null;
  datetime: string | null;
};

const [rows] = await connection.query<DateTimeRow[]>(
  'SELECT date, time, datetime FROM test_table'
);

// A one-off shape intersects RowDataPacket inline
const [rows] = await connection.query<(RowDataPacket & { count: number })[]>(
  'SELECT COUNT(*) as count FROM test_table'
);
```

---

## 3. Import conventions

1. **`import type`** for type-only imports:

   ```ts
   import type { RowDataPacket, FieldPacket } from '../../promise.js';
   import type { TypeCastField, ConnectionOptions } from '../../index.js';
   ```

2. **`.mjs` extension** when importing another `.mts` file, since TypeScript `NodeNext` resolves `.mjs` to `.mts`:

   ```ts
   import { createConnection } from '../../common.test.mjs';
   ```

3. **`.js` extension** for library imports:

   ```ts
   import mysql from '../../../index.js';
   import type { RowDataPacket } from '../../../promise.js';
   ```

---

## 4. Process

1. **Read** the target `.mts` file.
2. **Run** `npx tsc --noEmit --pretty <file>` to collect the compiler errors.
3. **Audit** every `any` (`: any`, `as any`, `<any>`, callback parameters) and every non-null assertion `!` by hand. `noImplicitAny: false` means `tsc` never reports `any`, and `!` always compiles, so a clean build proves nothing about either.
4. **Classify** each error, each `any`, and each `!` against the decision tree above.
5. **Fix** them one at a time:
   - Drop the annotation from callback parameters and let inference work.
   - Replace `any` in a variable declaration with the real type.
   - Replace `!` with optional chaining: `fields![0].name` becomes `fields?.[0].name`.
   - Add the missing `import type` statements.
   - Add the generic to `.query<T>()` and `.execute<T>()`.
   - Add `// @ts-expect-error: TODO: implement typings` where the library type is missing.
   - Add `// @ts-expect-error: internal access` where the property is internal.
   - Declare a `type` alias for a test-local structure.
6. **Re-run** `npx tsc --noEmit --pretty <file>`.
7. **Re-audit** the file for `any` and `!`.
8. **Done** when all three hold: no compiler errors, no `any`, no `!`.

---

## 5. Pitfalls

- **`any` is forbidden.** Every `: any`, `as any`, and `<any>` has to go, and step 3 above is the only thing that finds them.
- **`!` is forbidden.** `fields![0].name` is a hack that silences the compiler, `fields?.[0].name` is safe access.
- **The two `@ts-expect-error` comments are not interchangeable.** `TODO: implement typings` tracks work the library owes, `internal access` marks something intentionally private. Collapsing them loses the distinction that makes the first list actionable.
- **A change in `/typings` lands on both APIs.** Verify the callback entry (`typings/mysql/index.d.ts`) and the promise entry (`promise.d.ts`) together, and remember that touching `QueryableBase` or `ExecutableBase` reaches `Connection`, `Pool`, and `PoolNamespace` at once.
