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

The test runner is **Poku** ([docs](https://poku.io/docs) · [repo](https://github.com/wellwelwel/poku)).

Poku treats `async`/`await` just like standard JavaScript: use `await` on `describe`/`it`/`test` **only** when the callback is asynchronous. Otherwise, do not include `async` or `await`.

Test files use `.mts` (ESM TypeScript) and support top-level `await`.

Assertions, utilities, and test structure come from Poku:

```ts
import { describe, it, assert, skip, sleep, strict } from 'poku';
```

- `skip` — Skips the entire test file and reports it (e.g., Deno-only tests, specific Node versions, etc.).
- `sleep` — Waits for a given duration when needed: `await sleep(100)`.

### `async`/`await`

**Asynchronous:**

```ts
await describe('test', async () => {
  const connection = await createConnection();

  await it('should do something', async () => {
    const result = await connection.promise().query('SELECT 1');
    assert(result);
  });

  await connection.promise().end();
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

### Connection scope and resource cleanup

Never close the connection in the same scope as an assertion that may fail. If the assertion throws, `end()` will never be reached and the process will hang indefinitely.

Separate creation/cleanup into an outer scope:

```ts
// ❌ Wrong — end() in the same scope as the assertion
await describe('test', async () => {
  it('should do something', async () => {
    const connection = await createConnection();
    assert(false);
    await connection.end(); // never reached
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

### Closing connections

Prefer `await conn.promise().end()` instead of wrapping callbacks in `new Promise`:

```ts
// ❌ Avoid
await new Promise<void>((resolve) => pool.end(() => resolve()));

// ✅ Prefer
await pool.promise().end();
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

### Reference files

| File                      | Description                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `poku.config.js`          | Poku config: parallel/sequential suites, timeouts, test directories (`test/unit`, `test/integration`, `test/global`)                                                |
| `test/common.test.mts`    | Shared helpers: `createConnection`, `createPool`, `createPoolCluster`, `getConfig`, `createServer`, `getMysqlVersion`, etc. **Read this before writing new tests.** |
| `test/docker-compose.yml` | Local environment with MySQL, Node, Deno, Bun, and coverage                                                                                                         |

### Useful scripts

```sh
npm run typecheck                        # type-check the project
npm run lint:fix                         # fix lint and formatting
FILTER=test/unit/my-test.mts npx poku    # run a specific test via Poku
npx tsx test/unit/my-test.mts            # run a test directly
```

---

## Pull Request Reviews

When reviewing a PR, alert the author in the following cases:

- **Fix without tests** — Bug fix without tests covering the fixed scenario. Request tests that would fail without the fix.
- **Feature without tests** — New feature without test coverage.
- **Feature without docs** — New feature without documentation.

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

Do not approve a PR that violates the items above without first alerting the author.
