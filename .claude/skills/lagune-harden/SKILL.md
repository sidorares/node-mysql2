---
name: lagune-harden
description: Apply the defense plan's fixes to the code, safely and one at a time, then record what was applied and what is left. Reads the plan and the charter, then hardens every fix, the fixes, files, or directories you name, or a priority you choose.
argument-hint: Optionally name fixes, files/dirs, or priorities, or leave empty to apply every fix
user-invocable: true
---

## User Input

<user-input>
  $ARGUMENTS
</user-input>

The User Input above decides how this command runs. Read it before proceeding. A placeholder left unfilled above is not the input: the User Input is then the words that came with this command, or empty when there are none.

## Outline

You are applying the **defense plan** to the code and producing a **hardening record** at `.lagune/memory/harden.md`: a record of which plan fixes were applied, what changed in the code, and what is still left. This phase **continues from plan**. Plan already decided the fix for each finding and its priority, so this phase does not re-decide the fix: it applies it. Every change you make must come from a fix that is really in the defense plan, never a fix you invent here. This is the one phase that **changes the user's code**, so it is the one that must be the most careful.

The defense plan is the primary input: the changes follow from the fixes it lists. The charter is the governing context: its principles still bind what you do, and a fix must never be applied in a way that breaks one.

### Step 1: Decide the scope from the input

This phase is built entirely on the defense plan. It applies fixes the plan already decided. The User Input selects one of three modes:

- **No input** (the User Input is empty): apply **every fix** in the defense plan, highest priority first. This is the full hardening pass across the planned context.
- **Fixes, files, or directories given** (the input names one or more fix names from the plan, or paths in the project): apply only the matching fixes. Match a name to the plan's fix names, and match a path to the fixes through the tracking map (`.lagune/tracking.json`), which records the paths each fix points at. Leave the rest of the plan untouched.
- **One or more priorities chosen** (the input names priorities, for example `High`, or `High and Medium`): apply only the fixes the plan gave any of those priorities. The pass covers those priority bands, not the whole plan.

If the input is ambiguous, prefer the most literal reading (an existing path is a path, a known fix name is a fix), and state which mode you chose before continuing.

### Step 2: Load context

- Load the defense plan at `.lagune/memory/plan.md`. This is the **required primary input**.
  - If it does not exist, **stop and tell the user to run `/lagune-plan` first**. There is nothing to apply without it. Do not invent fixes to work around a missing plan.
  - If it exists, read its fixes. Each fix's name, priority, the principle it upholds, any `Depends on` it carries, and the finding it points at is what you apply. Apply only fixes that are really in the plan.
  - **Check that the scope is covered by the plan** before applying:
    - If **nothing** in the scope you chose is in the plan (the named fixes match no fix, the named paths match no fix's finding evidence, or no fix carries any of the named priorities), **stop and tell the user** to run `/lagune-plan` on that scope first, then run the harden phase again. Do not apply a change the plan did not call for.
    - If the scope is **partly** covered, apply the fixes that are in the plan, and record each uncovered part under **Remaining**. Do not stop, and do not invent a fix for the uncovered part.
- Load the hardening record at `.lagune/memory/harden.md`.
  - If it does not exist, initialize it from `template.md`, next to this file, first, and identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
  - If it already exists, read what was applied before. You will reconcile it in Step 3 before applying anything new. Each applied block's identity is the plan fix it points at plus the change it records. A block may also carry a `Verdict` and `Reason` that verify wrote: a `❌ Reproved` or `❓ Inconclusive` verdict means verify judged the control did not close the risk, and its `Reason` is what you re-apply against.
- Load the charter at `.lagune/memory/charter.md` for the governing principles, **if it exists**. The principles still bind here: never apply a fix in a way that breaks one. If the charter does not exist, apply the fixes from the plan alone.
- Load the specializations that detect applied. The "Applied specializations" section of `.lagune/memory/detect.md` names them as the catalog lists them. Read each one by calling `lagune_read` with `command` set to `catalog` and `arguments` set to `["<name>"]`, not just the list: each carries the defense knowledge for its class of finding (uploads, shell, network, and so on), which Step 4 uses to apply the matching fix. If a listed specialization no longer resolves, note it and apply the fix from the plan and charter alone.

### Step 3: Reconcile the existing record

This record is reconciled, never append-only. If the record was empty or freshly initialized, skip this step. Otherwise, before applying anything new, re-check each existing applied block against the current code:

- **Still holds:** the change is still in the code and the plan still carries its fix. Keep it, and update its wording or evidence if the code moved on.
- **Reverted or dropped:** the change is no longer in the code, or the plan no longer carries that fix. **Remove the block** from the record. Do not keep stale entries for history. The record reflects the code as it is now.
- **Reproved by verify:** a block with `Verdict: ❌ Reproved` is reopened work, and the verdict overrides your own reading. Even when it reads `Applied` and the control looks present, verify proved the risk still open: read its `Reason` and re-apply in Step 4 to close that gap. A `❓ Inconclusive` is weaker: re-apply only when its `Reason` names a real gap.
- Only re-check blocks that fall within the current scope. A block outside the scope you are running stays untouched.

A finding the plan carries but no block here names was stood down out of the chain: expected, and no reason to run repair.

If reconciling reveals the chain is inconsistent (for example the tracking map points a control at a file that was renamed or moved, so the path on record no longer exists), run `/lagune-repair` and then continue. Repair fixes Lagune's internal tracking across every phase at once, so the chain stays coherent. Do not try to repair the tracking yourself: this phase reconciles its own record in prose, repair owns the tracking.

### Step 4: Apply the fixes, safely and one at a time

This is the one place Lagune changes the user's code. Do not ask for a confirmation of your own before you start: whether an edit needs the user's approval belongs to the agent and the permission mode it runs under, not to Lagune. Apply the planned fixes carefully:

- **One fix at a time, dependencies first, then highest priority.** When a fix carries a `Depends on`, apply the fix it depends on before it, even when that one's priority is lower. Among the fixes free to apply, follow priority order (Critical, then High, then Medium, then Low). Apply each fix on its own so each change stays small, reviewable, and easy to undo.
- **Apply the smallest change that holds the control.** Make the fix the plan described, nothing more. Do not refactor unrelated code, do not add features, do not widen the change beyond the fix.
- **Close the risk at its chokepoint, not only the reported path.** When the same weakness is reachable through more than one caller, place the control where they converge (the shared function, the boundary they all pass through) so every path is covered at once. Patching only the path the finding named leaves the sibling callers open.
- **Trace the flow before you mark a fix applied.** Follow the path the untrusted data or the risk takes end to end, and confirm the control sits on that path, not beside it. A safe function added next to the unsafe one that still runs is not applied. Be brief with the change, never with understanding what it protects.
- **Leave the control a regression check where the project already tests.** On a security-sensitive path, the smallest test that fails if the control is later removed or bypassed is part of finishing the fix, not extra scope, and it gives verify something concrete to read. Where the project has no test setup, do not scaffold one: note the missing check under Remaining so verify and the user see the gap.
- **Apply each fix the way its specialization prescribes.** When a finding's class has a specialization loaded in Step 2, apply the plan's fix in line with that specialization's guidance. The plan decides the fix, the specialization informs how to apply it safely. Where they speak to the same control, follow both.
- **Stay safe-by-default.** The change must leave the project safe out of the box. Never weaken an existing control to apply a new one, and never break a charter principle to satisfy a fix. If a fix would conflict with a principle, stop and surface the conflict to the user rather than applying it.
- **Use real, current dependencies when one is needed.** If a fix needs a library, prefer the project's existing tools, and when a new one is genuinely needed, pin a real, maintained version and note it. Confirm the version against current documentation rather than memory.
- **When a fix cannot be fully applied**, apply what you safely can and record the rest. Mark the block `Partial` with what is left, or `Blocked` with the reason, and leave the plan fix open. Do not force a change you are unsure of.
- **Reset the verdict on a block you re-apply.** Its old `Verdict` no longer reflects the code, so set it back to `Pending` and remove the `Reason`. `Pending` is the only `Verdict` you ever write: judging the control is verify's job.

### Step 5: Fill the template

- Replace every placeholder with concrete text. Leave no bracket tokens behind.
- Set `Scope` to reflect the mode you ran: all fixes, the named fixes or paths, or the chosen priorities.
- **Merge, do not overwrite.** The record now holds the reconciled blocks from Step 3 plus what you applied in Step 4. Add a new block only for a fix you actually applied this run, not already represented. Do not duplicate a block that is already there under a different wording.
- Write one block per applied finding, titled with the finding's name (verbatim from the plan and detect, no action prefix). Each block MUST carry these parts:
  - **Status:** one of `Applied`, `Partial`, or `Blocked`.
    - **Applied:** the control is fully in place in the code.
    - **Partial:** some of the control is in place, the rest goes under Remaining.
    - **Blocked:** the control could not be applied, with the reason, and the plan fix stays open.
  - **What changed:** the change made, in plain language any reader understands.
  - **Where:** a short, plain-language note of where the change landed (the function or area) and any dependency added, so the change can be reviewed and the next phase can verify it. Do not write the file path here. The path goes to the tracking map in Step 7, where reconcile keeps it current through a rename.
  - **Verdict:** `Pending` on any block you write or re-apply (see Step 4).
  - **Reason:** verify's, left off a `Pending` block.
- The template ships with three starter blocks. This is a starting point, not a limit. Add or remove blocks so the record matches what was actually applied.
- Record anything left under **Remaining**: the rest of a Partial fix, a Blocked fix and why, or a fix this run did not reach. Name the plan fix each item belongs to. Remove that section if every in-scope fix is fully `Applied`.
- Set `Hardened` to today's date in ISO format `YYYY-MM-DD`.

### Step 6: Validate before writing

- No bracket tokens remain.
- Every block is titled with a finding name that really exists in the defense plan, and carries Status, What changed, and Where.
- No block for a finding the plan no longer carries, or a change no longer in the code, is still in the record, and no block is duplicated.
- Every `Status` is one of `Applied`, `Partial`, or `Blocked`, and every `Partial` or `Blocked` fix has a matching entry under Remaining.
- Every block you wrote or re-applied this run carries `Verdict: Pending` with no `Reason`, and you wrote no other verdict value.
- No applied change breaks a charter principle or weakens an existing control.
- Each applied fix whose class has a specialization follows that specialization's guidance, with nothing it says about the applied control skipped.
- The `Scope` line matches the mode you actually ran.
- The date is ISO `YYYY-MM-DD`.

### Step 7: Write and track

- Write the reconciled record to `.lagune/memory/harden.md`, re-reading it first to keep any change made since you loaded it.
- Register the items you hardened so the tracking map keeps each one current. This is registration, not reconciliation: hand the track hook only the findings this run hardened, as the `entries` list of `{name, paths}`, named by the finding's name (your section title, the same name the plan used). The hook finds that same item by name and updates its `paths`. It does not create a second entry: one finding is one item. `name` is the finding's name, and `paths` holds the file paths the change landed in. The path lives here, in tracking, never in the prose. Call `lagune_write` with `command` set to `track` and this payload as the single item of `arguments`:

```json
{ "entries": [{ "name": "<FINDING NAME>", "paths": ["<PATH>"] }] }
```

Do not edit `.lagune/tracking.json` yourself, and do not reconcile here. Track only advances what this phase hardened. Repairing the map across the conveyor stays with `/lagune-repair`.

### Step 8: Check the written record

Call `lagune_read` with `command` set to `validate` and `arguments` set to `["harden"]`. If it reports problems, follow its output and rerun it until it passes.

### Step 9: Summarize

Output a short summary to the user:

- The scope you ran (all fixes, named fixes or paths, or priorities).
- The fixes applied, each with its status and a one-line note of what changed, in the order you applied them.
- What changed since the last run: blocks added, blocks removed because the fix is gone or the change was reverted, and blocks updated.
- Anything left under Remaining, including any part of the scope the plan did not cover, and any Blocked fix.
- A suggested commit message, for example `fix: apply security hardening from the defense plan`.
- **Next step:** point the user to `/lagune-verify`, the phase that proves each applied control actually holds. Make clear the applied controls are not yet proven until verify confirms them. Frame it as the recommended next step. If anything is left under Remaining (a Blocked fix, or a part the plan did not cover), name what is still open so the user can decide whether to revisit `/lagune-plan` or rerun `/lagune-harden` before verifying.

Keep the record in plain language throughout. A non-developer should understand what was changed and what is still open, while the `Where` note stays precise enough that, with the path from the tracking map, `/lagune-verify` can act on it.

## Engine

Run every `lagune <subcommand>` call from the project root through the `lagune_read` and `lagune_write` MCP tools and, only if those tools are not available, run it in the shell as `npx --yes lagune@0.20.0 read <command> <arguments>` and `npx --yes lagune@0.20.0 write <command> <arguments>` as a fallback.
