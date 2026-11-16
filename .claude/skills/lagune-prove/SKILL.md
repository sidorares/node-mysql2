---
name: lagune-prove
description: Prove detected findings with runnable, defense-only evidence. For each finding the detect map carries, it writes a safe-path JavaScript test and a self-contained advisory under `.lagune/proofs/`. The test asserts secure behavior, never an exploit.
disable-model-invocation: true
argument-hint: Optionally name findings or files/dirs to prove, or leave empty to prove every detected finding
user-invocable: true
---

## User Input

<user-input>
  $ARGUMENTS
</user-input>

The User Input above decides how this command runs. Read it before proceeding. A placeholder left unfilled above is not the input: the User Input is then the words that came with this command, or empty when there are none.

## Outline

You are producing **proofs** under `.lagune/proofs/`: for each detected finding you can demonstrate, a runnable test and a self-contained advisory that a maintainer can take into responsible disclosure. The **detect map** at `.lagune/memory/detect.md` is the primary input, and every proof points back at a finding that map really carries.

This command is **optional and autonomous**. It is not one of the five phases and not part of the tracking chain. It writes only into `.lagune/proofs/`, and it is **read-only on the reconciled phase artifacts** (`detect.md`, `plan.md`, `harden.md`, `charter.md`) and on the user's source under test. Only `verify` writes across the chain, so this command never removes or rewrites a finding.

Each proof is two things, kept as a unit in its own directory:

- A **test** that asserts the **safe path**: it expects success on the secure behavior, so it fails while the issue persists and passes once the code is fixed. This is defensive regression evidence, never an exploit or an attack payload. The test comes first, it is the evidence that actually runs.
- A **self-contained advisory** the user can paste straight into a private GitHub Gist per vulnerability, so it never relies on a parent README or sibling files. Its **Proof of Concept** is a **runnable** reproduction through the project's public API, **derived from the test** and written only after it: a reviewer copies the block, runs it, and sees the symptom from the code's own output, the way a disclosure report shows the path a user reaches the issue through.

### Step 1: Decide the scope from the input

The User Input selects one of three modes:

- **No input** (the User Input is empty): prove **every finding** in the detect map.
- **Findings, files, or directories given** (the input names one or more finding names from the map, or paths in the project): prove only the matching findings. Match a name to the map's findings, and match a path to the findings through the tracking map (`.lagune/tracking.json`), which records the paths each finding points at. Leave the rest untouched.
- **A concern described** (the input describes what to focus on, for example "the SQL handling"): prove only the findings that touch that concern.

If the input is ambiguous, prefer the most literal reading (an existing path is a path, a known finding name is a finding), and state which mode you chose before continuing.

### Step 2: Load context

- Load the detect map at `.lagune/memory/detect.md`. This is the **required primary input**.
  - If it does not exist, **stop and tell the user to run `/lagune-detect` first**. There is nothing to prove without it. Do not invent findings to prove around a missing map.
  - If it exists, read its findings. Each finding's name (its section title) is the identity a proof traces back to.
- Read the tracking map (`.lagune/tracking.json`) to resolve each in-scope finding's file paths. The detect prose carries no path, by design, so the path comes from here.
- Load the charter at `.lagune/memory/charter.md` for governing context, **if it exists**. A proof demonstrates a risk the charter's principles exist to prevent.

### Step 3: Authorization and defense-only gate

This command produces evidence against real code, so confirm the framing before generating anything.

- **Authorization.** Confirm with the user that they are authorized to test the target (its owner, a maintainer, or an authorized researcher). If they are not, stop.
- **Defense only.** If the user instead asks for a working exploit, an attack payload meant to run against a third party, or detection-evasion, **refuse**: a proof asserts the safe path, it never emits an attack input. Dual-use content is acceptable only in this clearly defensive, authorized framing.

### Step 4: Read the target and pick the runner

The proofs are always JavaScript and live in Lagune's own directory, not in the project's test suite, so they stay portable across whatever language the project is written in. This step gathers what writing that proof needs.

- **Read the source the finding points at.** Open the file paths the tracking map gave you in Step 2 and read the vulnerable code, so you know how to reach it from JavaScript (the exported function, the route, the command it builds). This is the one place that reads the user's source under test, and it stays read-only. Note any fixture the proof will need (for example a database the project already brings up via Docker Compose).
- **Pick the runner.** Read the project's `package.json`. If **Poku** is already a declared dependency there, write the proof for Poku (it resolves its imports, since it is installed). Otherwise, write the proof for the **native Node.js test runner** (`node:test` with `node:assert/strict`), which needs nothing installed. Either way the proof is JavaScript and self-contained in `.lagune/proofs/`.

### Step 5: Generate, per finding, a directory with a test and a self-contained advisory

Ensure `.lagune/proofs/` exists, with a `.gitignore` inside it holding the single line `*`, so the proofs never reach a commit while the issue is open. For each in-scope finding, derive a directory name by slugging the finding's name: lowercase it, replace every run of characters outside `a-z 0-9 -` with a single `-`, trim leading and trailing `-`, and collapse repeats. Create `.lagune/proofs/<slug>/` holding **exactly two files, never more**:

- **`report.test.mjs`** (or **`report.test.cjs`** for CommonJS): one JavaScript test asserting the safe path, never the unsafe one. Use the runner picked in Step 4: **Poku** when the project already declares it in `package.json`, otherwise the native Node.js test runner.

  Follow the shape for the runner you picked, replacing the cases with the proof of the finding. The message on each `it` and assertion describes the safe behavior, never a failure note. Avoid comments in the test file, prefer the messages on the `describe`, `it`, and the assertions, for example:

  Poku, when it is already in the project's `package.json`, run with `node <test-file>`:

  ```cjs
  const { describe, it, strict } = require('poku');

  describe('[FINDING_NAME]', () => {
    it('[describe the safe behavior]', () => {
      strict.strictEqual(
        sanitize('[input]'),
        '[expected]',
        '[describe what holds when safe]'
      );
    });
  });
  ```

  ```mjs
  import { describe, it, strict } from 'poku';

  await describe('[FINDING_NAME]', async () => {
    const connection = await createConnection('[connection options]');

    await it('[describe the safe behavior]', async () => {
      const actual = await connection.query('[input]');

      strict.strictEqual(
        actual,
        '[expected]',
        '[describe what holds when safe]'
      );
    });

    await connection.end();
  });
  ```

  Or for native Node.js runner, run with `node --test <test-file>`:

  ```cjs
  const { describe, it } = require('node:test');
  const strict = require('node:assert/strict');

  describe('[FINDING_NAME]', () => {
    it('[describe the safe behavior]', () => {
      strict.strictEqual(
        sanitize('[input]'),
        '[expected]',
        '[describe what holds when safe]'
      );
    });
  });
  ```

  ```mjs
  import strict from 'node:assert/strict';
  import { after, before, describe, it } from 'node:test';

  describe('[FINDING_NAME]', () => {
    let connection;

    before(async () => {
      connection = await createConnection('[connection options]');
    });

    after(async () => {
      await connection.end();
    });

    it('[describe the safe behavior]', async () => {
      const actual = await connection.query('[input]');

      strict.strictEqual(
        actual,
        '[expected]',
        '[describe what holds when safe]'
      );
    });
  });
  ```

  A fixture the proof needs (a service, a process, a database the project already brings up) is set up and torn down in the outer `describe` scope, in Poku's case directly and in the native runner's through its `before` and `after` hooks, never beside an assertion that may fail.

  Any fixture file the test writes (a temporary upload, a sample input, a scratch file) stays inside the proof's own directory, never in the project root. Resolve fixture paths against the **test file's own directory**, not the current working directory: `import.meta.dirname` in `.mjs`, `__dirname` in `.cjs`. Delete whatever the test creates in the teardown, so the directory keeps only its two files between runs.

- **`report.md`**: the advisory, initialized from `template.md`, next to this file. Write it **after** the test, since its **Proof of Concept** is derived from the test, never the reverse. Fill every placeholder with concrete text from the finding and the project's manifest, following each field's guidance in the template, and leave no bracket token behind. Rate the **Severity** by the rating guide at the foot of the template: build the CVSS:4.0 vector from facts charter and detect already captured rather than re-asking the user, score it with the cvss hook (call `lagune_read` with `command` set to `cvss` and `arguments` set to `["--vector", "<VECTOR>"]`), write the vector followed by the score and band it printed on the advisory's CVSS line, and set the Severity to that band. State plainly that EPSS and exploit-maturity are out of scope because the finding is pre-disclosure with no CVE, and when a needed fact is missing, name the assumption instead of guessing. The **Proof of Concept** is a **runnable, self-contained** reproduction through the **attacker's real entry point** (the public API, the exposed route, the connection, the query the hostile server answers), distilled from the test you already wrote. It must run as-is and show the symptom from its own output, never narrate it. Three hard requirements, all mandatory: (1) **it enters where the attacker enters**, going through the same entry point a real attacker uses and never reaching into internal modules the attacker cannot call, so when the issue needs a hostile input, stage that condition through a legitimate mechanism of that same entry point (for a database, a self-referential query the local server answers so the server itself returns the crafted field; for a route, the crafted request sent to it), since importing a backend file and hand-building an internal packet is how the regression test proves the fix, not how an attacker reaches the bug, (2) **it runs with no remote host and no service to stand up and ends by printing or returning the observable effect** (the polluted prototype, the leaked value, the guard error that failed to fire) with every value concrete, so a comment like `// here the server would return X` is forbidden, it proves nothing, and (3) **it is a reproduction, not a weapon**, demonstrating the vector to a maintainer with no destructive step and no payload aimed at a third party. If you cannot build this proof of concept through a real entry point, there is no advisory: a report without the proof is a suspicion, not a proven finding. Do not fall back to an internal-path reproduction or a narrated comment to fill the block. Drop the finding, leave no directory for it, and report it to the user as not proven, the same way Step 5 handles a finding the test does not demonstrate. Below the proof, the run command for this finding's own test stays as the regression check. The advisory also carries a **Possible fix**: a theoretical direction in one or two sentences, direct and code-free, naming what the secure behavior should be. It is a pointer for the maintainer, not an applied or verified fix, since applying and proving the fix stays the job of `/lagune-harden` and `/lagune-verify`, never this command.

Then:

- **Prove, do not assume.** Create the directory **only for a finding whose test demonstrates the issue and whose advisory carries a runnable Proof of Concept through a real entry point**. Both are required: a finding the test does not reproduce, or one with no proof of concept reachable through the attacker's real entry point, gets no directory. A report without the proof is a suspicion, not a proven finding, so it is dropped, not written.
- **Do not touch `detect.md`.** When a finding is not proven, whether its test does not reproduce or no proof of concept reaches it through a real entry point, this command does not remove it from the map: that is not its job, and only `verify` writes across the chain. Instead, report it plainly to the user as not proven, noting which of the two reasons applies, and recommend they run `/lagune-detect` on that spot to reconcile, the same way `verify` routes an out-of-scope suspicion back to detect.
- **Reconcile, never append.** On a re-run, re-check each existing `<slug>/` directory against the current detect map: keep the proof if its finding still holds, rewrite its two files where the details changed, and delete the whole directory for any finding no longer in the map or no longer demonstrated. The proofs reflect the present, not the past.

### Step 6: Write the index

Write `.lagune/proofs/README.md` as a **local index only**: a short header plus a table of the proven findings, one row each. Use these exact column headers, in this order, so the index is the same shape every run:

| Finding | Severity | Category / CVE | Advisory | Test (Proof) |
| ------- | -------- | -------------- | -------- | ------------ |

Each row carries the finding name, its severity, its category/CVE, a link to its `<slug>/report.md` under **Advisory**, and a link to its `<slug>/report.test.mjs` (or `.cjs`) under **Test**. This index stays in the repo for navigation, and it is not part of any Gist. Reconcile it so its rows match exactly the proof directories that exist now.

Under the table, add a **Run all proofs** section with both commands verbatim, so the user can run every proof at once on either platform:

````md
## Run all proofs

Unix shell:

```sh
for f in .lagune/proofs/*/*.test.{mjs,cjs}(N); do echo "> $f"; node "$f"; done
```

Windows (PowerShell):

```powershell
Get-ChildItem .lagune/proofs -Recurse -Include *.test.mjs,*.test.cjs | ForEach-Object { Write-Host "> $($_.FullName)"; node $_.FullName }
```
````

### Step 7: Validate before finishing

- Every proof directory targets a finding that really exists in the detect map, and at rest holds exactly `report.md` and `report.test.mjs` (or `report.test.cjs`), nothing more. A fixture the test writes during a run lives under this same directory and is cleaned up in the teardown.
- Every advisory is self-contained, with every placeholder filled and no bracket token left.
- Every advisory's **Proof of Concept** is runnable as-is (no remote host, no service to stand up), reproduces through the attacker's real entry point (never reaching into internal modules the attacker cannot call), and ends by printing or returning the concrete symptom from its own output, never a narrating comment. It is derived from the finding's test and carries no destructive step. A finding with no such proof of concept has no directory at all: it is dropped and reported to the user as not proven, never written with an internal-path reproduction or a narrated comment standing in for the proof.
- No test asserts on the unsafe path: each waits for success on the safe behavior.
- The index lists exactly the proof directories that exist.
- Nothing was written outside `.lagune/proofs/`. The reconciled phase artifacts (`detect.md`, `plan.md`, `harden.md`, `charter.md`) and `.lagune/tracking.json` were not touched, and the user's source under test was only read.

### Step 8: Summarize

Output a short summary to the user, in plain language:

- The scope you ran (every finding, named findings or paths, or a concern).
- The findings proven, each with its proof directory and the run command for the runner used, for example `node --test .lagune/proofs/<slug>/report.test.mjs` (or `node .lagune/proofs/<slug>/report.test.mjs` when the project uses Poku).
- Any in-scope finding **not proven**, with the reason (its test did not reproduce, or no proof of concept reached it through a real entry point), and a recommendation to run `/lagune-detect` on that spot so the map can reconcile.
- What changed since the last run: proofs added, proofs removed because the finding is gone or no longer reproduces, and proofs updated.
- That each proven finding's two files belong together in a **private GitHub Gist** to report the vulnerability, kept private until the maintainers have resolved the issue.
- That these proofs are evidence of a live, undisclosed vulnerability, so they should **not** be committed while the issue is open: keep them local and share them only through the private Gist. Do not suggest a commit for them.
- **Next step:** the user's own disclosure process for the proven findings, starting from those private Gists. Note that closing a finding in the Lagune chain is still the job of `/lagune-harden` and `/lagune-verify`: this command produces evidence, it does not close anything.

## Engine

Run every `lagune <subcommand>` call from the project root through the `lagune_read` and `lagune_write` MCP tools and, only if those tools are not available, run it in the shell as `npx --yes lagune@0.20.0 read <command> <arguments>` and `npx --yes lagune@0.20.0 write <command> <arguments>` as a fallback.
