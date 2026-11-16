# [PROJECT_NAME] Security Charter <!-- Example: the project's name followed by "Security Charter" -->

## Principles <!-- Principles are reconciled, never appended: on a re-run, keep, rewrite, or remove each one to match the project as it is now. The two below are a shape to follow, not a quota. Write only the principles this project needs, and as many as it needs. -->

### [PRINCIPLE_1_NAME] <!-- Example: I. Secrets never live in code or version history -->

[PRINCIPLE_1_RULE] <!-- Example: Never commit a secret. Always load secrets from the environment or a secrets manager. -->

- Why: [PRINCIPLE_1_RISK] <!-- Example: A leaked key in git history is a full account takeover, and history is forever. -->

### [PRINCIPLE_2_NAME] <!-- Example: II. All input is untrusted until validated -->

[PRINCIPLE_2_RULE] <!-- Example: Treat all input as untrusted. Always validate and escape data from users, uploads, and third parties before it reaches any query, command, or output. -->

- Why: [PRINCIPLE_2_RISK] <!-- Example: Unchecked input is how injection attacks take over a system, whether it is SQL in a query, a command in a shell call, or a script in a page. -->

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

- This charter guides every security decision in each Lagune phase, and every change to it is reviewed and approved by the maintainer.
- It holds only what a deterministic check cannot capture, so it never repeats a control that linters or automated tools already enforces.

Version: [VERSION] | Ratified: [RATIFICATION_DATE] <!-- Example: Version: 1.0.0 | Ratified: 2026-06-11 -->
