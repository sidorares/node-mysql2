# MySQL2 Security Charter

## Principles

### I. The database server and the network are untrusted input

Treat both sides of every connection as hostile until proven otherwise. Always treat the bytes the application hands the driver (queries and their values) and the bytes the MySQL server sends back (metadata, rows, auth challenges, file requests, keys) as attacker-controlled. Never assume the server is honest or that the network path is private.

- Why: a database driver sits between two untrusted worlds. The application may pass along input from its own users, and the server it talks to can be compromised, malicious, or impersonated by anyone on the network. Every risk below starts here: if the driver trusts either side, it can be turned against the millions of applications that depend on it.

### II. Data is never confused with SQL

Always keep values separate from the query text. Every value that reaches a query MUST travel through the driver's parameterization (prepared statements or placeholders) or its vetted escaping (`escape` for values, `escapeId` for names the query cannot parameterize). Never build a query by pasting a raw value into the SQL string, and never weaken, shortcut, or bypass the escaping and parameterization primitives the driver exposes.

- Why: these primitives are the whole reason applications trust this driver to keep user input out of their queries. A single flaw in escaping, or an internal path that concatenates a value straight into SQL, is SQL injection at the scale of every application that installs the package: stolen data, silent tampering, and full database takeover.

### III. Server-chosen names are neutralized before they become code or object keys

The row parsers compile JavaScript at runtime for speed, and they build result objects whose keys are column and table names chosen by the server. Any server-supplied name that is spliced into generated code MUST first pass through the vetted escaper, and any name used as a result-object key MUST be screened against prototype-reaching names (`__proto__`, `constructor`, `prototype`, and the accessor twins). Never interpolate a raw server value into a compiled function, and never assign a server-named key onto a plain object without that screen.

- Why: the server picks the names, and the driver turns them into running code and into keys on live objects. A name that slips into generated code unescaped lets a malicious server run arbitrary code inside the application. A name like `__proto__` used as a key can poison every object in the process, breaking logic far from the query. Both are remote takeover triggered by a value the application never chose.

### IV. The server can never make the client read local files on its own

Never read a local file just because the server asked for it. The client MUST NOT act on a server `LOCAL INFILE` request unless the application has explicitly opted in by providing a file or stream factory, and that behavior MUST NOT be widened into a default.

- Why: the MySQL protocol lets the server tell the client "send me this file." A driver that obeys by default hands a malicious or compromised server any file the application process can read: environment secrets, private keys, source code. Requiring the application to opt in is the wall that keeps a hostile server out of the local disk.

### V. Parsing untrusted input can never stall or exhaust the process

Reading a packet or matching a pattern against outside data MUST be bounded. Always check lengths and limits before reading server bytes, and never run a backtracking-prone or unbounded regular expression on server- or application-supplied input.

- Why: the driver runs on Node's single event loop. One malformed packet or one catastrophic pattern does not slow a single query, it freezes the entire application until it finishes. That turns any connection, or any crafted string, into a lever that takes the whole process down.

### VI. The connection is confidential and the peer is proven before any secret travels

When TLS is enabled, certificate verification (`rejectUnauthorized`) MUST default to on and MUST never be silently disabled. Credentials that would cross the wire in cleartext MUST require a secure channel first. Never send a password or secret over a connection whose peer has not been verified.

- Why: the database password and every query ride this connection. If the driver skips the certificate check or lets cleartext authentication run on a bare socket, anyone on the network path reads the credentials and the traffic, then owns the database from the wire. The application never sees it happen.

### VII. Connection credentials never leak into logs, errors, or history

Never write a connection password, authentication token, or other secret into a log line, an error message, a thrown stack, or a file committed to the repository. Debug and diagnostic output MUST redact credentials.

- Why: the driver holds the database password on every connection. A secret echoed into a log or an error travels onward into log aggregators, crash reports, and support tickets, handing an attacker the keys without their ever touching the database.

### VIII. Every dependency and every release is pinned, minimal, and vetted

Keep the runtime dependency set as small as the driver needs, and pin it through a committed lockfile. A new dependency or an upgrade MUST be vetted before it is adopted, never added for convenience. The published package MUST contain only the driver's own reviewed code, and the credentials that publish it MUST be protected.

- Why: with tens of millions of installs a month, this package is a prime supply-chain target. A malicious or hijacked dependency, or a poisoned release, does not compromise one application, it ships straight into every application that installs the driver, all at once. Fewer, pinned, vetted parts are the difference between a contained risk and an ecosystem-wide one.

### IX. The code's logic is the source of truth, not what it says about itself

Every security judgment MUST rest on what the code's logic actually does when it runs, never on what a comment, a variable or function name, a docstring, or documentation claims it does. Always confirm a control (input validated, value escaped, certificate verified, guard enforced) against the lines that execute it, and treat every such name or description as a claim to check against that logic, never as proof. Never accept a reassuring comment over a broken implementation as evidence that a control holds, and never mark a control proven or a finding closed on anything but the code that carries it out. When the words and the logic disagree, the logic is the truth.

- Why: a comment that promises a guard the code never performs is how a live vulnerability gets waved through as safe. Comments, names, and docs never run, so they drift from the logic over time and are cheap for anyone to make reassuring. Trust the words over the logic and a broken escape, an unverified certificate, or a missing length check passes review as handled, then ships to every application that installs the driver.

## Baseline discipline

Lagune holds this charter, every principle, every time. A principle is not suspended because a control looks small, familiar, or unlikely to be hit. This is not a judgement call.

### Only the controls the project needs

Lagune recommends and applies only the controls this project's context calls for. A control the project does not need is never added for completeness, and a generic checklist is not thoroughness. Every later phase acts on what the system actually does, never on what it might hypothetically do.

- Why: effort spent on risks the project does not have buries the risks it does have. Fewer, right-sized controls are easier to apply, prove, and keep true than a checklist no one finishes.

### Prefer the simplest vetted control

When a control is needed, reach for the safest option already proven, in order: a control this project already has, then a platform or framework built-in, then a well-maintained vetted library, and only then custom code. Never hand-roll a security primitive (cryptography, escaping, authentication, sessions) that a vetted standard already provides. A new dependency is new attack surface, justified and not assumed. Code, an endpoint, or a feature the project does not use is attack surface too, so removing it is itself a control.

- Why: hand-rolled security is where subtle, unaudited bugs live, and a second control duplicating an existing one is the one that gets forgotten and drifts. Boring, standard controls are easier to audit and harder to get wrong, and less surface is less to defend.

### When a control seems skippable

A control is held even when a reason to skip it feels reasonable:

- "Too small to need a control": small gaps are where breaches start.
- "Already handled elsewhere": assumed coverage is exactly how gaps hide.
- "Unlikely to be hit": attackers target the path no one is watching.
- "It works, ship it": working and safe are different claims, and the charter requires both.

## Governance

This charter guides every security phase (detect, plan, harden, verify) and every contribution that touches a security surface: query escaping and parameterization, packet parsing, the row-parser code generation, authentication, TLS, `LOCAL INFILE`, and the dependency set. It supersedes ad hoc decisions.

No change may weaken a principle without an explicit, reviewed decision recorded here. A fix or a feature that touches one of these surfaces MUST ship with tests that would fail without it, and any change to observable behavior MUST be checked for backward compatibility, since the driver targets Node 14 and above and holds to API compatibility for a very large installed base. A change that could break existing behavior is flagged before release even when it looks minor.

This charter is reconciled, never appended. When the driver changes, each principle is kept, rewritten, or removed to match what the code is now, not what it once was. Amendments update the version: MAJOR to remove or redefine a principle, MINOR to add one or materially expand one, PATCH for wording and clarity.

Version: 1.1.0 | Ratified: 2026-07-17
