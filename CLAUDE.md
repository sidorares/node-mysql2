# MySQL2 — Agent Instructions

You are an expert Node.js developer contributing to MySQL2, a high-performance MySQL driver focused on compatibility.

## Project

- Minimum compatibility: **Node 14** (ignore the `engines` field in `package.json`).
- Core: `/lib` → exposed via `index.js` (callback) and `promise.js` (promise-based).
- Types: `/typings` → exposed via `index.d.ts` and `promise.d.ts`.
- Documentation: `website/docs/` (Docusaurus).
- Tests:
  - Unit: `test/unit` (parallel)
  - Integration: `test/integration` (parallel, runs alongside unit tests)
  - Global: `test/global` (sequential — robust tests that affect MySQL Server global state with advanced cleanup)

---

## Tests

**Read `test/common.test.mts` before writing any test.** It provides shared helpers: `createConnection`, `createPool`, `createPoolCluster`, `getConfig`, `createServer`, `getMysqlVersion`, etc.

The test runner is **Poku** ([docs](https://poku.io/docs) · [repo](https://github.com/wellwelwel/poku)). Test files use `.mts` (ESM TypeScript) and support top-level `await`.

Assertions, utilities, and test structure come from Poku:

```ts
import { describe, it, assert, skip, sleep, strict } from 'poku';
```

- `skip` — Skips the entire test file and reports it (e.g., Deno-only tests, specific Node versions, etc.).
- `sleep` — Waits for a given duration when needed: `await sleep(100)`.

| File                      | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| `test/common.test.mts`    | Shared helpers — **read before writing new tests**                  |
| `poku.config.js`          | Poku config: parallel/sequential suites, timeouts, test directories |
| `test/docker-compose.yml` | Local environment with MySQL, Node, Deno, Bun, and coverage         |

```sh
npm run typecheck                        # type-check the project
npm run lint:fix                         # fix lint and formatting
FILTER=test/unit/my-test.mts npx poku    # run a specific test via Poku
npx tsx test/unit/my-test.mts            # run a test directly
```

### Connection scope and resource cleanup

Never close the connection in the same scope as an assertion that may fail. If the assertion throws, `end()` will never be reached and the process will hang indefinitely.

Separate creation/cleanup into an outer scope:

```ts
// ❌ Wrong — end() in the same scope as the assertion
await describe('test', async () => {
  await it('should do something', async () => {
    const connection = await createConnection();
    assert(false);
    await connection.end(); // never reached
  });
  // process hangs
});

// ❌ Wrong — try-finally is a workaround, not a fix
await describe('test', async () => {
  await it('should do something', async () => {
    const connection = await createConnection();
    try {
      assert(false);
    } finally {
      await connection.end();
    }
  });
  // process hangs
});

// ✅ Correct — end() in an outer scope
await describe('test', async () => {
  const connection = await createConnection();

  it('should do something', () => {
    assert(false); // fails in its own scope
  });

  await connection.end(); // always reached
});
```

- Applies to any teardown method (`close`, `end`, `destroy`, `release`) and any connection type (`Connection`, `Pool`, `PoolCluster`, etc.).
- Use nested or dedicated `describe` blocks to isolate each connection.
- The same applies to callbacks — `end()` may be inside a nested callback that is never invoked if an assertion fails first.

Prefer `await conn.promise().end()` instead of wrapping callbacks in `new Promise`:

```ts
// ❌ Avoid
await new Promise<void>((resolve) => pool.end(() => resolve()));

// ✅ Prefer
await pool.promise().end();
```

### Avoid timer-dependent tests

Avoid writing tests that depend on `setTimeout` or `sleep` to wait for internal timers (e.g., idle timeout cleanup). These can produce flaky results in CI environments like GitHub Actions, where execution timing is unpredictable. Instead, call the internal method directly or assert the state synchronously right after the action. If a timer-based behavior must be tested (e.g., a "timebomb"), isolate it in a way that does not depend on wall-clock timing.

### `async`/`await`

Poku treats `async`/`await` just like standard JavaScript: use `await` on `describe`/`it`/`test` **only** when the callback is asynchronous. Otherwise, do not include `async` or `await`.

**Asynchronous:**

```ts
await describe('test', async () => {
  const connection = createConnection().promise();

  await it('should do something', async () => {
    const result = await connection.query('SELECT 1');

    assert(result);
  });

  await connection.end();
});
```

**Synchronous:**

```ts
describe('test', () => {
  it('should do something', () => {
    strict.equal(1 + 1, 2);
  });
});
```

### Prefer promise-based API

When writing new tests, prefer the promise-based API via `.promise()`. Use callbacks only for testing events, streams, features unavailable in the promise API, or when a feature genuinely needs coverage in both modes (callback + promise).

> Recommendation, not a strict rule.

```ts
const connection = createConnection({
  /* ... */
}).promise();
const pool = createPool({
  /* ... */
}).promise();

const cluster = createPoolCluster({
  /* ... */
});
cluster.add('node1', {
  /* ... */
});
const clusterConnection = await cluster.promise().getConnection();
```

### TypeScript in tests

Never use `as unknown as` or `any` in test files.

When accessing MySQL2 internals not exposed in the public typings (e.g., `server._server`, `pool._allConnections`), use exactly:

```ts
// @ts-expect-error: internal access
```

When a type in `typings/` is wrong or missing and the contribution has no relation to that type, use exactly:

```ts
// @ts-expect-error: TODO: implement typings
```

If the type error **is** related to the contribution, fix the type in `typings/` instead of suppressing it.

---

## Pull Request Reviews

When reviewing a PR, alert the author in the following cases:

- **Fix without tests** — Bug fix without tests covering the fixed scenario. Request tests that would fail without the fix.
- **Feature without tests** — New feature without test coverage.
- **Feature without docs** — New feature without documentation.
- **Potential breaking change** — Flag any change that could break existing behavior, even in patches or minor features. Not an error, but crucial to avoid unintentional semver violations.

### Required checklist

Before approving any PR, verify:

**General:**

1. **Tests** — Does the bug fix or feature include tests?
2. **Documentation** — Do new features include documentation?

**Tests:**

3. **Connection scope** — Is `end()`/`close()`/`destroy()`/`release()` in an outer scope, separate from assertions?
4. **`process.exit`** — If used to skip a test conditionally, suggest using Poku's `skip` instead.
5. **`new Promise` + `setTimeout`** — Suggest using Poku's `sleep` instead.
6. **`node:assert` or `node:test`** — Suggest importing from `poku` instead. Require `strict` instead of `assert`.
7. **`as unknown as` or `any`** — Never use in test files.
8. **`@ts-expect-error`** — Must use exactly `// @ts-expect-error: internal access` or `// @ts-expect-error: TODO: implement typings`. If the type error is related to the contribution, fix the type instead.
9. **Timer-dependent tests** — Tests that use `setTimeout` or `sleep` to wait for internal timers can be flaky in CI. Suggest asserting state synchronously or calling the internal method directly.

**Types:**

10. **Typings structure** — Type definitions must follow the existing structure in `/typings`. Do not add types in arbitrary locations.

Do not approve a PR that violates the items above without first alerting the author.
