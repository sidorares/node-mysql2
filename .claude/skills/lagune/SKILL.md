---
name: lagune
description: Use this skill whenever you are about to build or change code. It builds safe-by-default from the project's charter and the defensive security knowledge the work touches, then checks the result.
argument-hint: Describe the work to do, and Lagune builds it safely
user-invocable: true
---

## User Input

<user-input>
  $ARGUMENTS
</user-input>

The User Input above decides how this command runs. Read it before proceeding. A placeholder left unfilled above is not the input: the User Input is then the words that came with this command, or empty when there are none.

## Outline

You are doing the work the prompt asks for (a login page, an upload, an endpoint, whatever it is), and **making it secure as you build it**: the same work you would do anyway, built so the code is safe-by-default the moment it lands. This bends to any prompt at any stage, from a first scaffold to a change on a mature codebase.

### Step 1: Load the charter

Read the charter at `.lagune/memory/charter.md`, if it exists: its security principles are the rules every part of this work must respect. When there is none, proceed on the safe-by-default baseline the specializations carry, and tell the user in one line that you are working without a charter.

### Step 2: Work out what you are about to build

Before any specialization or any code, think through the work the prompt asks for the way you normally would: what you will build, the pieces it needs, and the boundaries it crosses. A login page implies credentials, a session, and a form that takes input from outside. An upload implies a file crossing a boundary and landing somewhere. An endpoint implies untrusted input and a response.

This is your own reasoning, not a checklist, and its only job is to give Step 3 something concrete to match: the security-relevant surfaces of what you are about to build.

A prompt may also mention a side quest, the dashboard's name for anything a phase left open under `.lagune/memory/`: detect's **Not determined**, plan's **Open questions**, and harden's **Remaining**.

### Step 3: Match the specializations to the work

Specializations are focused, language-agnostic security knowledge modules that load only on demand. List the catalog once: call `lagune_read` with `command` set to `catalog`.

It prints each specialization this project uses as `name: tags`, suffixing ` [required]` on any the catalog flags. The tags say what each one covers. Reach a verdict on every entry, one at a time:

- **`[required]`:** always applies. Its knowledge governs the work regardless of what you are building.
- **Its context is in the work:** the thing its tags name is part of what you are about to build (its tags say uploads and you are building an upload). It applies.
- **Its context is not in the work:** nothing you are building touches what its tags name. Skip it. Most entries will not apply to a given piece of work, and that is normal.

Judge from your Step 2 reasoning, not from how relevant an entry feels. Read every entry that applies by calling `lagune_read` with `command` set to `catalog` and `arguments` set to `["<name>"]`, one at a time: each carries the defense knowledge for its class of work (uploads, shell, sessions, and so on). Keep the list of specializations you applied for Steps 5 and 6.

### Step 4: Build it, safe-by-default

Build what the prompt asked for and nothing beyond it, exactly as you normally would, with the charter's principles and the matched specializations shaping every security-relevant part. It is the work itself, not an audit of the surrounding code.

- **Apply the defense inline, not afterward.** As you write each part a specialization covers, apply its guidance there and then. Validate input at the boundary, not later. Reach for the safe construct the first time, not after a working-but-unsafe version.
- **Stay safe-by-default.** The result must be safe out of the box, and no feature request outweighs that. Never leave a default that is unsafe until configured.
- **Prefer the simplest vetted control.** Reach for what already exists in order: the project's own tools first, then a platform or framework built-in, then a well-maintained library, and only then custom code. Never hand-roll a security primitive (such as cryptography, escaping, authentication, sessions) a vetted standard already provides.
- **Never break a charter principle to satisfy the prompt.** If doing what was asked would violate a principle, stop and surface the conflict to the user rather than building it that way.
- **Use real, current dependencies.** When a new one is genuinely warranted, pin a real, maintained version and confirm it against current documentation rather than memory.

### Step 5: Check your own work against what you used

Before you call the work done, re-read what you built, without rebuilding it, and confirm the defense holds for each specialization you applied in Step 3 and each charter principle that bears on this work:

- **Is the control on the path, not beside it?** Follow the untrusted data or the risk end to end through what you built, and confirm the guard sits on that path. A safe function written next to the unsafe one that still runs is not applied.
- **Is it complete?** The size limit lands but the file-type check is missing, the one route is guarded but a sibling route is not: an incomplete control leaves the risk reachable.
- **Where a specialization ships a deterministic checker** (a hook it tells you to run), run it over what you built. Its verdict stands over your own reading.

If the check finds a gap, close it now and re-check, until the defense holds across everything you built.

### Step 6: Summarize

Output a short summary to the user, in plain language a non-developer understands:

- What you built, in one or two lines.
- Whether a charter was in effect, or that you worked without one.
- The specializations you applied and, for each, the defense it shaped in what you built. If none applied, say so in one line.
- Any gap Step 5 found, and that it is now closed.
- Any point where the safe choice differed from what was literally asked, and how you resolved it (or the conflict you surfaced, if a principle stopped you).

## Engine

Run every `lagune <subcommand>` call from the project root. If the `lagune_read` and `lagune_write` MCP tools are available, make every call through them. Otherwise, run it in the shell as `npx --yes lagune@0.20.0 read <command> <arguments>` and `npx --yes lagune@0.20.0 write <command> <arguments>` as a fallback.
