# MySQL2 — Agent Instructions

You are an expert Node.js developer contributing to MySQL2, a high-performance MySQL driver focused on compatibility.

## Project

- Minimum compatibility: **Node 14**, whatever the `engines` field in `package.json` declares.
- Core: `/lib`, exposed through `index.js` (callback) and `promise.js` (promise-based).
- Types: `/typings` (`.d.ts` files), exposed through `index.d.ts` (callback) and `promise.d.ts` (promise-based).
- Documentation: `website/docs/` (Docusaurus).
- Tests:
  - Unit: `test/unit`, parallel.
  - Integration: `test/integration`, parallel, alongside the unit tests.
  - Global: `test/global`, sequential, for tests that change MySQL Server global state and need careful cleanup.

---

## Skills

- Use the [`/lagune` skill](.claude/skills/lagune/SKILL.md) whenever you build or change code, so it improves safety by default. When it is not available, install it from its manifest with `npx -y lagune@latest pull`.
- Read the [code review skill](.github/skills/code-review/SKILL.md) before reviewing a pull request, a diff, or a branch.
- Read the [typings skill](.github/skills/types/SKILL.md) when working on `/typings` or fixing a type error in a test.

---

## Comments

Never add an obvious comment nor narrate a statement: code that needs a comment to be understood is usually poorly implemented, and comment length measures how bad the code underneath it is.

When code feels like it needs an explanation, improve the implementation instead: clear names, decoupled functions with a defined scope, and proper abstractions.

---

## Tests

**Read `test/common.test.mts` before writing any test.** It provides the shared helpers for creating connections, pools, clusters, and servers, and for reading the test configuration.

The test runner is **Poku** ([docs](https://poku.io/docs), [repo](https://github.com/wellwelwel/poku)). Test files use `.mts` (ESM TypeScript) and support top-level `await`.

Assertions, utilities, and test structure come from Poku:

```ts
import { describe, it, assert, skip, sleep, strict } from 'poku';
```

- `skip` skips the entire test file and reports it, for cases like a Deno-only test or a specific Node version.
- `sleep` waits for a given duration: `await sleep(100)`.

| File                      | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| `test/common.test.mts`    | Shared helpers                                                      |
| `poku.config.js`          | Poku config: parallel/sequential suites, timeouts, test directories |
| `test/docker-compose.yml` | Local environment with MySQL, Node, Deno, Bun, and coverage         |

```sh
npm run typecheck
npm run lint:fix
FILTER=test/unit/my-test.mts npx poku    # run a single file through Poku
npx tsx test/unit/my-test.mts            # run a single file directly
```

### Connection scope and resource cleanup

Never close the connection in the same scope as an assertion that may fail. When the assertion throws, `end()` is never reached and the process hangs indefinitely.

Open and close the connection in an outer scope:

```ts
// ❌ Wrong: end() sits in the same scope as the assertion
await describe('test', async () => {
  await it('should do something', async () => {
    const connection = await createConnection(); // same for pool or cluster connections
    assert(false);
    await connection.end(); // never reached
  });
  // process hangs
});

// ❌ Wrong: try-finally is a workaround, not a fix
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

// ✅ Correct: end() in an outer scope
await describe('test', async () => {
  const connection = await createConnection();

  it('should do something', () => {
    assert(false); // fails in its own scope
  });

  await connection.end(); // always reached
});
```

- Every teardown method and every connection type is affected: `close`, `end`, `destroy`, `release`, on `Connection`, `Pool`, `PoolCluster`, and the rest.
- Use nested or dedicated `describe` blocks to isolate each connection.
- Callbacks fail the same way, with the teardown buried in a nested callback that a failing assertion prevents from ever running.

Prefer `await conn.promise().end()` instead of wrapping callbacks in `new Promise`:

```ts
// ❌ Avoid
await new Promise<void>((resolve) => pool.end(() => resolve()));

// ✅ Prefer
await pool.promise().end();
```

### Avoid timer-dependent tests

Never wait on an internal timer, such as idle connection cleanup, with `setTimeout` or `sleep`. Execution timing in CI is unpredictable and the test turns flaky. Call the internal method directly, or assert the state synchronously right after the action. When the timer behavior itself is what needs coverage, isolate it so no assertion depends on wall-clock timing.

### `async`/`await`

Poku treats `async`/`await` just like standard JavaScript, so `describe`, `it`, and `test` are awaited **only** when the callback is asynchronous.

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

New tests prefer the promise-based API through `.promise()`. Callbacks stay for events, streams, anything the promise API does not cover, and features that genuinely need coverage in both modes.

> A recommendation, not a strict rule.

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

When reaching for an internal that the public typings do not expose, use exactly:

```ts
// @ts-expect-error: internal access
```

When a type in `typings/` is wrong or missing and the contribution has no relation to that type, use exactly:

```ts
// @ts-expect-error: TODO: implement typings
```

If the type error **is** related to the contribution, fix the type in `typings/` instead of suppressing it.

---

## Cursor Cloud specific instructions

MySQL2 is a **library**, not a long-running app. Development means installing the Node dependencies, starting MySQL for the integration tests, then running lint, typecheck, and tests against the driver.

### Services

| Service                          | Required?          | Notes                                                         |
| -------------------------------- | ------------------ | ------------------------------------------------------------- |
| **Node.js** (14 or later, CI 22) | Yes                | `npm ci` at repo root                                         |
| **MySQL**                        | Yes for full tests | Integration and global tests need a `test` database           |
| **Docker**                       | Recommended        | Runs MySQL the same way as CI                                 |
| **Docusaurus** (`website/`)      | Optional           | `cd website && npm ci && npm start`, on http://localhost:3000 |

### MySQL via Docker

Docker is installed on the VM, but the daemon may need a manual start when systemd is not active:

```sh
sudo dockerd > /tmp/dockerd.log 2>&1 &
```

Start MySQL, which creates the `test` database with an empty root password:

```sh
sudo docker compose -f test/docker-compose.yml up -d mysql
node tools/wait-up.js
```

Use `sudo docker` when the socket permission error appears. CI pins **MySQL 8.3** (`mysql:8.3`), while `test/docker-compose.yml` uses `mysql:lts`, currently 9.x. For full CI parity, run:

```sh
sudo docker run -d --name mysql -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -e MYSQL_DATABASE=test -p 3306:3306 mysql:8.3
```

Without `CI=1`, tests use an empty root password, matching docker-compose. With `CI=1`, set `MYSQL_PASSWORD=root`.

### Commands

See `package.json` and `Contributing.md` for the full set.

| Task        | Command                                            |
| ----------- | -------------------------------------------------- |
| Lint        | `npm run lint`                                     |
| Typecheck   | `npm run typecheck`                                |
| Tests       | `npm test` (or `FILTER=path/to/test.mts npx poku`) |
| Build check | `npm run test:build`                               |
| Website     | `cd website && npm ci && npm test`                 |

`test/global` runs sequentially and needs elevated MySQL privileges. Poku skips those files when `hasPrivileges()` fails, so a green local run does not prove they were exercised.
