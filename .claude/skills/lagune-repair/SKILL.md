---
name: lagune-repair
description: Repair Lagune's internal tracking so each item stays whole when files are renamed or moved, and check every memory artifact against its template. A maintenance pass, not a security phase, rewriting the tracking map across all phases in one pass.
argument-hint: Optionally name a phase or scope, or leave empty to repair the whole tracking map
user-invocable: true
---

## User Input

<user-input>
  $ARGUMENTS
</user-input>

The User Input above decides how this command runs. Read it before proceeding. A placeholder left unfilled above is not the input: the User Input is then the words that came with this command, or empty when there are none.

## Outline

You are reconciling Lagune's internal **tracking map** at `.lagune/tracking.json`: the side index that holds one entry per tracked item (a detect finding the later phases carry forward as the same item) so the item survives a rename or a moved file. Each item is one entry, identified by its name. The file paths live only in this map, never in the prose artifacts. So when a refactor renames or moves a file, the map is the one place that points at a path that no longer exists. Reconcile is the one act that corrects it.

Reconcile is whole, never partial. It reads **every** artifact under `.lagune/memory/` and the project's **current code**, works out where each item lives, and rewrites the tracking map in one pass. It never reconciles one phase in isolation, because a file renamed mid-flow touches every phase that referenced it, and updating only some of them is exactly the inconsistency this command exists to remove. The same whole-chain seat makes this the one command that checks every memory artifact against its template, reporting what drifted without touching it.

This is plumbing, not a security phase. It does **not** edit any `.lagune/memory/*.md` artifact and does **not** create a `.lagune/memory/repair.md`. The only file it changes is `.lagune/tracking.json`. The repair is internal.

### Step 1: Read the whole chain

Read every artifact that exists under `.lagune/memory/`: `detect.md`, `plan.md`, `harden.md`. Charter has no tracked items, so it is never reconciled. From each artifact, collect every section's title (the finding's name). The title is the same across phases, so a finding present in `detect.md` and again in `plan.md` is the one item: collect it once. Then read the current tracking map at `.lagune/tracking.json` for the paths each item holds: the artifacts hold no paths, the map does.

If no artifact exists yet, there is nothing to reconcile. Tell the user the chain has not been started and stop.

### Step 2: Confront the tracked paths with the current code

For each item, check the paths the tracking map holds for it against the project as it is now. When a path still exists, keep it. When it does not (the file was renamed or moved), read the code to find where that same item now lives, and use the **current** path. This is the one place reconcile reads the user's source: to learn the truth a renamed file hides. Build the corrected `{ name, paths }` for each item: the `name` is the finding's title unchanged, the `paths` set to the current locations. Do not change the name when you are only correcting paths, the name is its identity through the rename.

Where you genuinely cannot tell whether an item was resolved or merely renamed, do not guess. Leave its paths as you found them in the map and let the hook surface it as unresolved in the next step.

### Step 3: Rewrite the tracking map with the hook

Hand the hook one item per finding the artifacts still name, using the corrected paths from Step 2. The payload is `{ entries: [...] }`, the same shape as `tracking.json`: each entry is `{ name, paths }`, where `name` is the finding's title and `paths` holds its current file paths. List each item once, no matter how many phases name it. Call `lagune_write` with `command` set to `repair` and this payload as the single item of `arguments` (a name with quotes or backticks stays intact), then read the JSON result it prints:

```json
{ "entries": [{ "name": "<NAME>", "paths": ["<PATH>"] }] }
```

The hook compares every entry against the map and rewrites it: an item still named keeps its identity, an item whose paths moved gets the new paths, a name the map does not hold is registered, and an item you did not report is kept rather than deleted. It returns a classification per item and a list of `unresolved` items it could not decide alone. It never guesses the one call it cannot make: whether an item that disappeared was fixed or merely renamed.

### Step 4: Resolve what the hook could not decide

The hook returns `unresolved` for each item that was in the map but not named in any artifact you reported. Each carries its name, paths, and a reason:

- **`renamed-candidate`**: an item observed under a different name shares this one's tracked paths. Likely a rename, but the hook must not decide it alone. Confirm with the user, and if they confirm, run the hook again with the item under its current name so its identity carries over.
- **`orphan`**: the item is in the map but no artifact names it anymore. It may have been genuinely resolved (the logic deleted), or dropped by mistake. Ask the user before treating it as gone. If confirmed gone, delete that one entry from the map and remove the same-titled section from each `.md` that still carries it. Prefer to ask than to guess: a wrongly dropped item is how the chain breaks.

### Step 5: Check the whole memory

Call `lagune_read` with `command` set to `validate` and no `arguments`, which checks every memory artifact present against its template. Fix nothing: each artifact's shape belongs to the phase that writes it, so carry what the hook reports into the summary, each drifted artifact pointed at its own command (`/lagune-charter`, `/lagune-detect`, `/lagune-plan`, or `/lagune-harden`).

### Step 6: Summarize

- Write nothing to the artifacts. The hook already wrote `.lagune/tracking.json`.
- Output a short summary to the user, in plain language, leading with the items' names, never an internal id:
  - What was reconciled: items whose path was corrected after a rename or move, items newly registered, and any rename you confirmed.
  - Anything still unresolved and what would settle it.
  - What the memory check reported: each drifted artifact with the phase command that fixes it, and any warning worth attention. Nothing reported means the memory kept its shape, so say so.
  - A suggested commit message, for example `chore: repair the Lagune tracking map`.
  - **Next step:** if anything is still unresolved, name it so the user can settle it and rerun. Otherwise tell the user the tracking is coherent again. Say it as a suggestion, not a mandate.

Keep the summary in plain language. The tracking map is invisible plumbing, so tell the user what changed for each item, not how the map stores it.

## Engine

Run every `lagune <subcommand>` call from the project root through the `lagune_read` and `lagune_write` MCP tools and, only if those tools are not available, run it in the shell as `npx --yes lagune@0.20.0 read <command> <arguments>` and `npx --yes lagune@0.20.0 write <command> <arguments>` as a fallback.
