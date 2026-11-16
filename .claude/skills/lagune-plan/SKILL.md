---
name: lagune-plan
description: Turn what detect found into the defense plan, one fix per finding, each rated by CVSS v4.0 (category, CVSS, priority) and tied to a charter principle. Reads the detect map and the charter, then plans every finding, named paths, or a concern you describe.
argument-hint: Optionally name files/dirs or a concern, or leave empty to plan every finding
user-invocable: true
---

## User Input

<user-input>
  $ARGUMENTS
</user-input>

The User Input above decides how this command runs. Read it before proceeding. A placeholder left unfilled above is not the input: the User Input is then the words that came with this command, or empty when there are none.

## Outline

You are producing a **defense plan** at `.lagune/memory/plan.md`: a prioritized set of fixes for what detect found, each one pointing at a detect finding, rated with a category and a CVSS v4.0 score, paired with the charter principle it upholds, and the control to apply. This phase **continues from detect**. Detect already detected what the system does and recorded the risk each thing carries, so the plan does not restate the risk: it rates how serious it is and decides what to do about it. Every fix must point at something detect actually detected, never a generic checklist. The fixes are the WHAT to do. Applying them is the next phase, harden, not this one.

The detect map is the primary input: the fixes follow from what detect found. The charter is the governing context: it tells you which fixes matter most for this project, gives each fix a principle to uphold, and supplies the exposure and stakes that adjust each rating. The rating follows the CVSS v4.0 Base-and-Environmental method, scored by the cvss hook, so a finding earns a realistic, reproducible band with a named category, reasoned from the detect map and the charter alone.

### Step 1: Decide the scope from the input

This phase is built entirely on the detect map. It never reads the code directly: it only knows the system through what detect already detected. Every fix it plans must point at a finding that is really in the detect map. The User Input selects one of three modes, and each one is answered from the detect map, never from the code:

- **No input** (the User Input is empty): plan the fixes for **every finding** in the detect map. This is the full defense plan across the detected context.
- **Files or directories given** (the input names one or more paths in the project): plan the fixes for the detect findings whose **evidence** points at those paths. Match paths to findings through the tracking map (`.lagune/tracking.json`), which records each finding's paths, do not open the files yourself. Leave the rest of the plan untouched.
- **A concern described** (the input describes a worry, for example "where sensitive data could leak"): plan the fixes **for that specific concern**, drawing on the detect findings that relate to it. The plan covers what the user asked about, not the whole context.

If the input is ambiguous between a path and a described concern, prefer the most literal reading (an existing path is a path), and state which mode you chose before continuing.

When the scope points somewhere detect has not mapped, follow the coverage rules in Step 2 rather than reading the code to fill the gap.

### Step 2: Load context

- Load the detect map at `.lagune/memory/detect.md`. This is the **required primary input**.
  - If it does not exist, **stop and tell the user to run `/lagune-detect` first**. The defense plan is built from detected findings, so there is nothing to plan without it. Do not invent findings to work around a missing detect map.
  - If it exists, read its findings. Each finding's name and recorded risk is what a fix points at, and the tracking map holds the paths that finding lives at. Fixes only ever point at findings that are really in the map.
  - **Check that the scope is covered by detect** before planning:
    - If **nothing** in the scope you chose is in the detect map (the named paths match no finding's tracked paths, or no finding relates to the described concern), **stop and tell the user to run `/lagune-detect` on that scope first**, then run the plan phase again. Do not read the code to fill the gap.
    - If the scope is **partly** covered (some findings are in the map, but the paths or concern also reach things detect has not mapped), plan the fixes for what is covered, and record each uncovered part under **Open questions** (naming the uncovered path and noting the detect map does not cover it yet). Do not stop, and do not read the code for the uncovered part.
- Load the defense plan at `.lagune/memory/plan.md`.
  - If it does not exist, initialize it from `template.md`, next to this file, first, and identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
  - If it already exists, read the fixes already in it. You will reconcile them in Step 3 before adding anything new. Each fix's identity is the finding it points at plus the fix itself.
- Load the charter at `.lagune/memory/charter.md` for the governing principles, **if it exists**. Use it to judge which fixes matter most for this project, to give each fix the principle it upholds, and to supply the stakes side of the Environmental adjustment. The charter guides priority, it does not box you in: plan a real fix even if no principle names it, and let the user rescope. If the charter does not exist, plan the fixes from the findings alone and set each `Upholds` to `None directly`. The rating still stands: rate each finding on its CVSS Base score with only the exposure detect gives, since the charter's absence removes the stakes input to the Environmental adjustment, not the rating itself.

### Step 3: Reconcile the existing plan

This plan is reconciled, never append-only. If the plan was empty or freshly initialized, skip this step. Otherwise, before planning anything new, re-check each existing fix against the current detect map:

- **Still needed:** the finding it points at is still in the detect map and still unfixed. Keep it, and update its category, rating (CVSS and priority), reason for that priority, principle, dependency, references, or fix if the details changed. If a fix it depends on is gone from the detect map, drop the now-stale `Depends on`.
- **Done or gone:** the finding it points at is no longer in the detect map, or the detect map now shows it resolved. **Remove it** from the plan. Do not keep finished fixes for history. The plan reflects the work still to do, not the past.
- Only re-check fixes that fall within the current scope. A fix outside the scope you are running stays untouched.

A fix whose finding `verify` already proved closed was stood down out of the whole chain, so it is simply absent here. That absence is expected, not a broken chain, and is no reason to run repair.

If reconciling reveals the chain is inconsistent (for example the tracking map points a finding at a file that was renamed or moved, so the path on record no longer exists), run `/lagune-repair` and then continue. Repair fixes Lagune's internal tracking across every phase at once, so the chain stays coherent. Do not try to repair the tracking yourself: this phase reconciles its own plan in prose, repair owns the tracking.

### Step 4: Plan the fixes

For each in-scope detect finding, read the risk detect already recorded for it (do not restate that risk in the plan), then rate it and decide the fix that answers it. Reason the rating from the detect finding and the charter alone, and when a fact it needs is in neither, name the assumption rather than open the source. For each finding you plan:

- Title the block with the detect finding's name, verbatim, so it is the same item. Do not rename it or add an action prefix, and do not copy its file path into the plan: the path lives in the tracking map.
- Name the **category**: the risk class the finding maps to (for example "SQL injection", "Prototype pollution"), and a CVE only if one already exists for it. Name the class alone when there is none, and add the matching CWE where it sharpens the class.
- **Rate the finding** by the rating guide at the foot of `template.md`: build the CVSS:4.0 vector from what detect and the charter recorded, score it with the cvss hook, write it on `CVSS` followed by the score and band printed, and set `Priority` to that band, not a free choice.
- Write one plain-language line for **why this priority**: the Environmental metrics behind the band, how exposed the finding is (from detect) and what is at stake (from charter or detect). Do not restate the risk. This lets any reader see the order is justified.
- Name the charter principle the fix upholds, if the charter names one. If the fix supports more than one principle, name them all, separated by commas. If no principle fits, write `None directly` and keep the fix.
- Add a `Depends on` line only when this fix cannot hold until another finding's fix lands first, for example validating an input before encoding its output. Name that other finding verbatim, and omit the line otherwise. It sets the order to apply in, not the priority: the depended-on fix is applied first even when its priority is lower.
- Describe the control to apply: the WHAT to do, not the application. Applying is harden's job.
- Add **references** when they ground the category, CWE or OWASP links written as `[label](url)` markdown (not bare URLs), comma-separated. Omit them when there is nothing to cite beyond the class named, and never invent one.

Run the cvss hook: call `lagune_read` with `command` set to `cvss` and `arguments` set to `["--vector", "<VECTOR>", "--vector", "<VECTOR>"]`, a `--vector` before each vector.

One finding is one item, with one rating. When a finding needs more than one fix, write them as more than one paragraph under the block's `Fix`, never a second block. Plan what the findings support, nothing speculative.

### Step 5: Fill the template

- Replace every placeholder with concrete text. Leave no bracket tokens behind.
- Set `Scope` to reflect the mode you ran: all findings, the named files or directories, or the described concern.
- **Merge, do not overwrite.** The plan now holds the reconciled fixes from Step 3 plus what you planned in Step 4. Add a new block only for a finding genuinely new, not already represented. Do not duplicate a finding that is already there under a different wording.
- Write one block per finding, titled with the finding's name (verbatim from detect, no action prefix). Each block MUST carry these parts:
  - **Category:** the risk class the finding maps to, and a CVE only when one already exists. Name the class alone otherwise.
  - **CVSS:** the CVSS v4.0 vector with the score and band the cvss hook printed.
  - **Priority:** one of `Critical`, `High`, `Medium`, or `Low`: the band the cvss hook printed, not a free choice.
  - **Why this priority:** one plain-language line for the Environmental metrics behind the band, exposure and stakes (see Step 4).
  - **Upholds:** the charter principle the fix supports, or several separated by commas if it supports more than one. If no charter is loaded or none fits, write `None directly` and keep the fix.
  - **Depends on:** optional. Another finding this fix must follow, verbatim, several separated by commas. Omit the line when there is no real dependency.
  - **Fix:** the control to apply in harden, described not applied.
  - **References:** optional. CWE or OWASP links grounding the category, written as `[label](url)` markdown, comma-separated. Omit when there is nothing to cite beyond the class named, and never invent one.
- The template ships with three starter fixes. This is a starting point, not a limit. Add or remove fixes so the plan matches what the findings actually need.
- If part of the scope was not covered by the detect map, record it under **Open questions**. Do not invent a finding to fill the gap. Remove that section if there are none.
- Set `Planned` to today's date in ISO format `YYYY-MM-DD`.

### Step 6: Validate before writing

- No bracket tokens remain.
- Every block is titled with a finding name that really exists in the detect map, and carries Category, CVSS, Priority, Why this priority, Upholds, and Fix.
- Every `CVSS` carries the score and band the cvss hook printed for its vector, its `Priority` is that band, and the vector carries no Threat metric.
- Every block has a non-empty `Why this priority` line that gives the Environmental metrics (exposure and stakes) in plain words and does not restate the risk.
- No fix for a finding that Step 3 found resolved is still in the plan, and no finding is duplicated.
- Every `Priority` is one of `Critical`, `High`, `Medium`, or `Low`.
- Every `References`, where present, cites a real CWE or OWASP source, none invented.
- Every `Depends on`, where present, names a finding that really exists in this plan or the detect map.
- No dependency forms a loop. If A depends on B, B does not depend on A.
- The `Scope` line matches the mode you actually ran.
- The date is ISO `YYYY-MM-DD`.

### Step 7: Write and track

- Write the reconciled plan to `.lagune/memory/plan.md`, re-reading it first to keep any change made since you loaded it.
- Register the items you planned so the tracking map keeps each one current. This is registration, not reconciliation: hand the track hook only the findings this run planned, as the `entries` list of `{name, paths}`, named by the finding's name (your section title, the same name detect used). The hook finds that same item by name and updates its `paths`. It does not create a second entry: one finding is one item. `name` is the finding's name, and `paths` holds the file paths the fix touches. The path lives here, in tracking, never in the prose. Call `lagune_write` with `command` set to `track` and this payload as the single item of `arguments`:

```json
{ "entries": [{ "name": "<FINDING NAME>", "paths": ["<PATH>"] }] }
```

Do not edit `.lagune/tracking.json` yourself, and do not reconcile here. Track only advances what this phase planned. Repairing the map across the conveyor stays with `/lagune-repair`.

### Step 8: Check the written plan

Call `lagune_read` with `command` set to `validate` and `arguments` set to `["plan"]`. If it reports problems, follow its output and rerun it until it passes.

### Step 9: Summarize

Output a short summary to the user:

- The scope you ran (all findings, named files or directories, or concern).
- The fixes planned, each with its category, priority band, and one-line fix, highest priority first. When a fix depends on another, say so.
- What changed since the last run: fixes added, fixes removed because they are now done, and fixes updated (including a rating that moved band).
- Anything left under Open questions, including any part of the scope the detect map did not cover.
- A suggested commit message, for example `docs: update defense plan`.
- **Next step:** point the user to `/lagune-harden`, the phase that applies these fixes to the code, safely and one at a time, highest priority first. Frame it as the recommended next step. If anything is left under Open questions, point them instead to `/lagune-detect` on that uncovered scope first, so the plan can cover it before harden runs.

Keep the plan in plain language throughout. A non-developer should understand what each fix does and why it is prioritized: the CVSS vector and category are the precise, reproducible anchor, and the `Priority` band with its `Why this priority` line is that rating in words anyone can follow. The finding name in each title stays precise enough for harden to act on.

## Engine

Run every `lagune <subcommand>` call from the project root through the `lagune_read` and `lagune_write` MCP tools and, only if those tools are not available, run it in the shell as `npx --yes lagune@0.20.0 read <command> <arguments>` and `npx --yes lagune@0.20.0 write <command> <arguments>` as a fallback.
