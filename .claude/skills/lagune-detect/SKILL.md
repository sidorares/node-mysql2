---
name: lagune-detect
description: Detect what the system actually does by reading the code, and map the security-relevant findings (login, uploads, payments, data exposure, and so on) with the evidence later phases need. Scans the whole project, named files, or a focused scope.
argument-hint: Optionally name files/dirs or a focus, or leave empty for a full scan
user-invocable: true
---

## User Input

<user-input>
  $ARGUMENTS
</user-input>

The User Input above decides how this command runs. Read it before proceeding. A placeholder left unfilled above is not the input: the User Input is then the words that came with this command, or empty when there are none.

## Outline

You are producing a **detect map** at `.lagune/memory/detect.md`: a record of what the system actually does that carries security weight, based on reading the code. This is detection, not invention. Record only what the code supports, with the evidence (files, routes) that later phases need to act on. Each finding is also explained in plain language with its risk, so any reader understands it.

This phase works the same way whether the project is brand new or already exists. You map whatever code is present, even if there is very little.

### Step 1: Decide the scope from the input

The User Input selects one of three modes:

- **No input** (the User Input is empty): run a full scan across the whole project, the default for a general detect.
- **Files or directories given** (the input names one or more paths in the project): focus **only** on those paths. Do not scan the rest of the project. Map what those paths show.
- **A focus described** (the input describes what to look for, for example "make sure there is no sensitive data exposure"): scan the workspace **for that specific concern**. The map covers what the user asked about, not a general inventory.

If the input is ambiguous between a path and a focus, prefer the most literal reading (an existing path is a path), and state which mode you chose before continuing.

### Step 2: Load context

- Load the detect map at `.lagune/memory/detect.md`.
  - If it does not exist, initialize it from `template.md`, next to this file, first, and identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
  - If it already exists, read the findings already in it. You will reconcile them in Step 3 before adding anything new. Each finding's identity is its name (the section title), which the later phases reuse verbatim. The prose carries the wording, never the file path: the path lives only in the tracking map, where reconcile keeps it current.
- Load the charter at `.lagune/memory/charter.md` for context only, **if it exists**. Do not force the findings to fit the charter. Matching risks against the charter's rules is the plan phase, not this one. This phase stays a neutral detection of what the system does.

### Step 3: Reconcile the existing map

This map is reconciled, never append-only. If the map was empty or freshly initialized, skip this step. Otherwise, before detecting anything new, re-check each existing finding against the current code:

- **Still holds:** the code still supports it. Keep it, and update its wording or evidence if the details changed.
- **Resolved or gone:** the code shows it is fixed or no longer applies. **Remove it** from the map. Do not keep resolved findings for history. The map reflects the present, not the past.
- Only re-check findings that fall within the current scope. A finding outside the scope you are running stays untouched.

A finding that `verify` already proved closed was stood down out of the whole chain, so it is simply absent here. That absence is expected, not a broken chain, and is no reason to run repair.

If reconciling reveals the chain is inconsistent (for example the tracking map points a finding at a file that was renamed or moved, so the path on record no longer exists), run `/lagune-repair` and then continue. Repair fixes Lagune's internal tracking across every phase at once, so the chain stays coherent. Do not try to repair the tracking yourself: this phase reconciles its own map in prose, repair owns the tracking.

### Step 4: List the catalog and widen the read

Before you read the code, list the catalog once. This is the only read of the catalog in this phase: call `lagune_read` with `command` set to `catalog`.

It prints each specialization this project uses as `name: tags`. The list does two jobs. Its tags are search targets: each one sends you looking for that context in the code, widening the detection in Step 5. The list itself is the work list Step 6 carries forward to give every entry a verdict, so keep it whole and do not read the catalog again.

### Step 5: Read the code in scope and detect

Read the code within the chosen scope and detect the things that carry security weight. What carries weight depends on what the project is, so detect from the project at hand, not from a fixed list. As a starting point, the things to look for include untrusted input and how it is validated, secrets and configuration, data storage and any exposure of sensitive data, authentication and access control where the project has users, the boundaries where the project takes input from the outside (a web request, a command-line argument, a file it reads, a public API it exports, an external or third-party call), and any place it runs commands, queries, or deserializes data. A web service, a library, a CLI, a script, and a desktop or mobile app each weight these differently. Detect from evidence in the code, not from assumption. If the scope is a described focus, concentrate on that concern.

A control the code already applies is not closed by being present. When the code validates, sanitizes, or guards input with a construct a specialization covers, that guard is presumed unproven: it goes to the matching specialization in Step 6 to prove it holds.

### Step 6: Consult the specializations

Specializations are focused, language-agnostic security knowledge modules that load only on demand. This step is the door to them, and it has a fixed mechanism. Do not improvise an equivalent.

Work from the list Step 4 printed, the authoritative work list. The **tags are the matching signal, and they exist nowhere else**.

**Reach a verdict on every entry on that list, one at a time, before you write any finding.** An entry marked `[required]` is always applied: when it ships a deterministic checker, you run that checker over the whole project and its output is the verdict, never a skip. For every other entry, the only question is whether the code you read in Step 5 contains the context its tags name, read off the code, not estimated from how relevant the entry feels:

- **The context is present.** Apply the specialization. Read it by calling `lagune_read` with `command` set to `catalog` and `arguments` set to `["<name>", "--phase", "detect"]`, and follow it, scoped to the paths in question: do what it says, do not improvise beyond it, and do not edit the user's code. The verdict is whatever its checker prints over each pattern, destination, or value the code contains, or where it ships no checker, what its reasoning concludes against the actual code. A guard the code already applies is judged here, never waved through for being present.
- **The context is absent.** The code contains nothing the tags name, so there is nothing to apply. Skip it. Finding that many entries do not apply is a normal outcome.

Anything a specialization surfaces is recorded as a finding through the steps below, like any other. Hold each entry's verdict for the table Step 11 emits.

### Step 7: Fill the template

- Replace every placeholder with concrete text. Leave no bracket tokens behind.
- Set `Scope` to reflect the mode you ran: a full scan, the specific paths, or the described focus.
- **Merge, do not overwrite.** The map now holds the reconciled findings from Step 3 plus what you detected in Step 5. Add a new finding block only for something genuinely new, not already represented. Do not duplicate a finding that is already there under a different wording.
- Write one finding per detected item. Each finding MUST carry three parts:
  - **What it is:** a plain-language description any reader understands.
  - **Why it matters:** the risk it carries, in plain language. Explain the risk, not just the fact.
  - **Evidence:** a short, plain-language note of where the finding lives (the function or route, what the code does there) so later phases know what to act on. Do not write the file path here. The path goes to the tracking map in Step 9, where reconcile keeps it current through a rename, so the prose never carries a path that can go stale.
- The template ships with three starter findings. This is a starting point, not a limit. Add or remove findings to match what the code actually shows.
- Fill **Applied specializations** from the specializations you applied in Step 6, naming each one as `catalog` lists it, never by a path, and listing under it the finding(s) it surfaced or confirmed. Remove the section if none applied.
- If the scope asked about something the code did not make clear, record it under **Not determined**. Do not guess to fill a gap. Remove that section if everything in scope was determined.
- Set `Mapped` to today's date in ISO format `YYYY-MM-DD`.

### Step 8: Validate before writing

- No bracket tokens remain.
- Every finding has What it is, Why it matters, and Evidence, the Evidence note points at a real location you read, and it carries no file path (the path goes to the tracking map in Step 9).
- No finding that Step 3 found resolved is still in the map, and no finding is duplicated.
- Every finding's name is unique. The tracking map keys an item by its name alone, and the later phases reuse that name verbatim, so two findings sharing a name would collide into one item. If two would share a name, qualify each so they read distinctly.
- The `Scope` line matches the mode you actually ran.
- Step 6 holds a verdict for every entry Step 4 printed, none missing. For each, you either applied the specialization or can point to the code and show its context is genuinely absent. "It did not seem relevant" is not absence, nor is a guard the code already applies. If any entry has no verdict, go back and finish Step 6 first.
- The date is ISO `YYYY-MM-DD`.

### Step 9: Write and track

- Write the reconciled map to `.lagune/memory/detect.md`, re-reading it first to keep any change made since you loaded it.
- Register the findings you wrote so the tracking map keeps each one's identity. This is registration, not reconciliation: hand the track hook only the findings this run wrote, as the `entries` list of `{name, paths}`, and it records the new ones and follows a renamed path for the rest. It never removes anything you did not report. `name` is the finding's name (this section's title), and `paths` holds the file paths the finding points at (one or more). The path lives here, in tracking, never in the prose. The tracking map holds no note: the prose carries the wording, the map carries only identity and paths. Call `lagune_write` with `command` set to `track` and this payload as the single item of `arguments` (a name with quotes or backticks stays intact), then read the JSON result it prints:

```json
{ "entries": [{ "name": "<FINDING NAME>", "paths": ["<PATH>"] }] }
```

Do not edit `.lagune/tracking.json` yourself, and do not reconcile here. Track only registers what this phase wrote. Repairing the chain across phases stays with `/lagune-repair`.

### Step 10: Check the written map

Call `lagune_read` with `command` set to `validate` and `arguments` set to `["detect"]`. If it reports problems, follow its output and rerun it until it passes.

### Step 11: Summarize

Output a short summary to the user:

- The scope you ran (full scan, paths, or focus).
- The findings detected, each with its one-line risk.
- The verdict table from Step 6, one row for **every** entry Step 4 printed, never only the applied ones:

  | Specialization   | Context present?                                 | Verdict                                     |
  | ---------------- | ------------------------------------------------ | ------------------------------------------- |
  | the entry's name | Yes or No, with a short reason read off the code | `Applied`, with what it surfaced, or `Skip` |

  A `[required]` entry always reads `Applied`, even when its checker found nothing: its `Context present?` cell then states the checker ran across the whole project and what it returned.

- What changed since the last run: findings added, findings removed because they are now resolved, and findings updated.
- Anything left under Not determined.
- When this run created the map, unless the project's ignore files already carry them, suggest these `.gitignore` lines in the conversation to keep its open findings out of a public repository:

  ```gitignore
  /.lagune/memory/detect.md
  /.lagune/memory/plan.md
  /.lagune/memory/harden.md
  /.lagune/tracking.json
  ```

- A suggested commit message, for example `docs: update detect map`.
- **Next step:** point the user to `/lagune-plan`, the phase that turns these findings into prioritized fixes, each tied to a charter principle. Frame it as the recommended next step, and note they can rerun `/lagune-detect` (on the whole project or a narrower scope) whenever the code changes.

Keep the map in plain language throughout. A non-developer should understand what each finding is and the risk it carries, while the evidence stays precise enough for the next phases to use.

## Engine

Run every `lagune <subcommand>` call from the project root through the `lagune_read` and `lagune_write` MCP tools and, only if those tools are not available, run it in the shell as `npx --yes lagune@0.20.0 read <command> <arguments>` and `npx --yes lagune@0.20.0 write <command> <arguments>` as a fallback.
