# MySQL2 — Pull Request Review Skill

The review checklist for MySQL2 pull requests. Read it before reviewing a pull request, a diff, or a branch.

Never approve a PR that violates an item below without first alerting the author.

## General

1. **Tests:** every bug fix and every new feature ships with tests, and the tests for a fix must fail without it.
2. **Documentation:** every new feature is documented under `website/docs/`.
3. **Node 14 compatibility:** Node 14 is the minimum supported runtime, whatever the `engines` field declares.
4. **Breaking changes:** flag anything that can change existing behavior, even in a patch or a minor feature. The change itself is not an error, an unintentional semver violation is. A change to an existing test is the strongest signal there is, so read it closely for regressions.
5. **Comments:** ask for a better implementation, never for a better explanation.
   - An obvious comment is a finding on its own.
   - Comment length measures the code underneath it. The more explanation it needs, the worse it usually is.
   - A comment that explains the implementation is replaced by clear names, decoupled functions with a defined scope, and proper abstractions.

## Tests

6. **Connection scope:** `end()`, `close()`, `destroy()`, and `release()` belong in a scope outside the assertions. The wrong shapes are not obvious, so check them against the section below.
7. **`process.exit`:** a conditional skip uses Poku's `skip`.
8. **`new Promise` with `setTimeout`:** waiting uses Poku's `sleep`.
9. **`node:assert` and `node:test`:** assertions and test structure come from `poku`, and `strict` replaces `assert`.
10. **`as unknown as` and `any`:** never in test files.
11. **`@ts-expect-error`:** only `// @ts-expect-error: internal access` or `// @ts-expect-error: TODO: implement typings`, and only when the type error is unrelated to the contribution. When it is related, the fix belongs in `/typings`.
12. **Timer-dependent tests:** waiting on an internal timer is flaky in CI, so the test asserts the state synchronously or calls the internal method directly.
13. **Promise-based API:** new tests prefer `.promise()`. Callbacks stay for events, streams, anything the promise API does not cover, and features that genuinely need both modes. A recommendation, not a rule.
14. **`async`/`await`:** `describe`, `it`, and `test` are awaited only when the callback is asynchronous.

## Types

15. **Typings structure:** types follow the existing structure in `/typings` and never land in an arbitrary location. See the [typings skill](../types/SKILL.md) for the architecture and the known gaps.

## Connection scope

The most frequent contributor mistake, and the most expensive: a failing assertion skips the teardown and the test process hangs until CI times out. Both wrong shapes below read as correct at a glance, so compare the diff against them directly.

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
- Each connection is isolated by a nested or dedicated `describe`.
- Callbacks fail the same way, with the teardown buried in a nested callback that a failing assertion prevents from ever running.
- `await conn.promise().end()` replaces wrapping a callback in `new Promise`.

## Verifying the branch

```sh
npm run lint         # lint and formatting
npm run typecheck    # type-check the project
npm test             # full suite, or FILTER=path/to/test.mts npx poku for a single file
npm run test:build   # build check
```

Integration and global tests need a running MySQL with a `test` database. The global suite runs sequentially and needs elevated privileges, and Poku skips those files when `hasPrivileges()` fails, so a green local run does not prove they were exercised.
