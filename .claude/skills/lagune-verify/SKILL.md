---
name: lagune-verify
description: Prove each applied control holds by confronting the hardening record with the code, writing each verdict back into that record, then standing the findings proven closed out of the chain. Read-only on your code, it writes only Lagune's own chain.
argument-hint: Optionally name controls, files/dirs, or priorities, or leave empty to verify every applied control
user-invocable: true
---

## User Input

<user-input>
  $ARGUMENTS
</user-input>

The User Input above decides how this command runs. Read it before proceeding. A placeholder left unfilled above is not the input: the User Input is then the words that came with this command, or empty when there are none.

## Outline

You are proving that the controls hardening applied **actually hold**, and writing each verdict back into the **hardening record** at `.lagune/memory/harden.md`. This phase **produces no artifact of its own**: a verdict lives on its control's block, where harden reads it next run, and the session summary is your report to the user. It **continues from harden**, which already applied the controls, so it re-applies nothing: it proves what is there, for controls really in the record, never one you imagine.

Think of this phase as a **detect focused on the fixes**. It reads each place the record says a control was applied and confirms the code matches. The proof is this confrontation of **the record's claim against what the code shows** (Step 4 names how they can disagree), never a test you write or the system run live.

This phase is **read-only on the user's code**: no test, no dependency, no code edit. It writes only Lagune's own chain, and on the hardening record it touches only each block's `Verdict` and `Reason`, never the fields harden owns. It is also where the cycle **closes**: a control whose risk is proven closed is stood down, removed from the whole chain so it is not reprocessed. When every finding in scope is stood down, the cycle is at **rest**, reopened only when the code changes.

The hardening record is the **primary input**, and this phase is built entirely on it. The charter is the governing context: a control upholds a principle, so confirming the control holds is confirming that principle is met.

### Step 1: Decide the scope from the input

This phase is built entirely on the hardening record. It proves controls that record says were applied. The User Input selects one of three modes:

- **No input** (the User Input is empty): verify **every applied control** in the hardening record, highest priority first. This is the full verification pass across what was hardened.
- **Controls, files, or directories given** (the input names one or more control names from the record, or paths in the project): verify only the matching controls. Match a name to the record's applied controls, and match a path to the controls through the tracking map (`.lagune/tracking.json`), which records the paths each control points at. Leave the rest untouched.
- **One or more priorities chosen** (the input names priorities, for example `Critical`, or `Critical and High`): verify only the controls whose plan fix carried any of those priorities. The pass covers those priority bands, not the whole record.

If the input is ambiguous, prefer the most literal reading (an existing path is a path, a known control name is a control), and state which mode you chose before continuing.

### Step 2: Load context

- Load the hardening record at `.lagune/memory/harden.md`. This is the **required primary input**.
  - If it does not exist, **stop and tell the user to run `/lagune-harden` first**. There is nothing to prove without it. Do not invent controls to verify around a missing record.
  - If it exists, read its applied controls. Each block's name, status, what changed, and where is what you prove (Step 4 judges them). Verify only controls that are really in the record.
  - **Check that the scope is covered by the record** before validating:
    - If **nothing** in the scope you chose is in the record (the named controls match no applied control, the named paths match no control's evidence, or no control carries any of the named priorities), **stop and tell the user** to run `/lagune-harden` on that scope first, then run the verify phase again. Do not prove a control the record does not carry.
    - If the scope is **partly** covered, verify the controls that are in the record, and name each uncovered part in the summary. Do not stop, and do not invent a control for the uncovered part.
  - Read the `Verdict` and `Reason` any in-scope block already carries from a previous run. You will reconcile them in Step 3 against the current code before judging anything anew.
- Load the charter at `.lagune/memory/charter.md` **if it exists**: a control upholds a principle, so a control that fails to hold means its principle is not yet met. Without a charter, prove the controls from the record alone.

### Step 3: Reconcile the existing verdicts

The verdicts on the hardening record are reconciled, never left to drift. If no in-scope block carries a `Verdict` yet, skip this step. Otherwise, before judging anything anew, re-check each existing verdict against the current code:

- **Still valid:** re-reading the code still gives the same verdict. Keep the `Verdict` and `Reason`, updating the `Reason` if the gap moved on.
- **Flipped:** a control that was `❌ Reproved` or `❓ Inconclusive` now closes the risk, or one that held now fails. Re-read the code and take the current result: a now-closed risk becomes a stand-down candidate for Step 6.
- **Stale:** harden reset the block to `Verdict: Pending` because it re-applied the control. Treat it as unjudged and prove it fresh in Step 4.
- Only re-check verdicts within the current scope. A verdict outside the scope you are running stays untouched.

If reconciling reveals the chain is inconsistent (for example the tracking map points a control at a file that was renamed or moved, so the path on record no longer exists), run `/lagune-repair` and then continue. Repair fixes Lagune's internal tracking across every phase at once, so the chain stays coherent. Do not try to repair the tracking yourself: this phase reconciles its verdicts on the record, repair owns the tracking.

### Step 4: Confirm each control against the code

For each in-scope control, read the code and judge whether the **risk** is closed. You only read: no edit, no test, no dependency, no running the system.

- **Read where the control lives, and trace the risk's path.** The record's `Where` names the area and the tracking map (`.lagune/tracking.json`) holds its file paths. Open them and confront the record's `What changed` against the code: is the control actually present, complete, and correct, not merely named? Follow the path the risk takes end to end and confirm the control sits on it, not beside it. Where harden left a regression check, read it as evidence, but the verdict rests on the code you read, not the test's presence. Trust the code over the record, which can claim more than the code delivers.
- **Judge the risk, not the control.** The question is whether the security risk is gone from the code now. A control can be present yet leave the risk reachable, for example a safe function added beside the unsafe one that still runs. Do not soften this to match the record: a control the record calls `Applied` whose risk is still reachable is open.
- **A `Partial` or `Blocked` control is open** by definition: confirm only the part a `Partial` applied, and leave a `Blocked` control for harden.
- **A new problem is not yours to map.** If you notice a risk the detect map never covered, do not record it as a verdict. Tell the user to run `/lagune-detect` on that spot.

Each control lands in one of two outcomes, which drive the steps that follow:

- **Closed:** the control holds and nothing reopens the risk. The finding is done, stood down in Step 6, with no verdict recorded.
- **Open:** anything else, recorded in Step 7 as `❌ Reproved` (the code contradicts the record, or the control is incomplete, absent, or bypassable) or `❓ Inconclusive` (the code cannot settle it, for example a control depending on configuration you cannot read).

### Step 5: Consult the specializations

Your work list is the "Applied specializations" section of `.lagune/memory/detect.md`, which names each specialization as the catalog lists it. Detect already matched them, so do not read the catalog again.

Read each listed specialization by calling `lagune_read` with `command` set to `catalog` and `arguments` set to `["<name>", "--phase", "verify"]`, one at a time, and apply it to the in-scope control its finding traces to, read-only on the user's code. When a specialization ships a deterministic checker (a hook it tells you to run), running that checker is the application, and its printed verdict is the control's verdict that your own reading never overrides. Where it ships no checker, follow its guidance to inform the verdict. If a listed specialization no longer resolves, note it and judge that control from the code alone.

Report the specializations you applied and the verdict each informed. If detect listed none, say so in one line.

### Step 6: Stand the closed findings down

Take the closed findings from Step 4. Standing each one down is **mandatory**, not a judgement call: a proven-closed risk leaves the chain. Hand every closed name to the untrack hook in one call for the batch: call `lagune_write` with `command` set to `untrack` and this payload as the single item of `arguments`:

```json
{ "names": ["<FINDING NAME>"] }
```

In one deterministic pass the hook removes each closed finding from `detect.md`, `plan.md`, and `harden.md` and drops the same names from the tracking map, deleting an artifact whose last finding is gone. Do none of that by hand, and do not edit `.lagune/tracking.json` yourself. This is the only tracking this phase touches: it never moves code, so it has no path to register. If there are no closed findings, skip to the next step.

The hook returns a `prose` array. A non-empty `dangling` list means a stood-down name still lingers in a section a finding block does not own, and the hook could not safely edit it. Reconcile **only** those spots, each given as a file, line, and the line's text: drop the name from that line, and remove the line or its section when nothing else remains under it. An empty `dangling` everywhere means there is nothing to reconcile.

### Step 7: Record the verdicts in the hardening record

Write each open control's verdict onto its block in `.lagune/memory/harden.md`, touching only the `Verdict` and `Reason`, never the `Status`, `What changed`, or `Where` harden owns. Add no section of your own to the file. Re-read it first to keep any change made since you loaded it, such as Step 6's.

- **`❌ Reproved`:** write the verdict and a one or two line `Reason` naming the gap (for example, the size limit lands but the file-type check is bypassable). This is what harden re-applies against, so be precise.
- **`❓ Inconclusive`:** write the verdict and a `Reason` naming what is missing to settle it.
- A block left at `Verdict: Pending` that you did not reach this run keeps its `Pending`.

### Step 8: Validate the pass

- Every open control carries `❌ Reproved` or `❓ Inconclusive` with a `Reason`, and every closed finding was handed to the untrack hook so its section is gone.
- Every `dangling` mention the untrack hook reported was reconciled, and you touched no free-prose line it did not flag.
- You touched only `Verdict` and `Reason`. No `Status`, `What changed`, or `Where` changed, and no section was added to `harden.md`.
- Every verdict rests on the code you read, not the record's claim, and nothing was written to the user's code.
- Every specialization detect listed was applied, none skipped, and where one ships a checker its printed verdict is the control's, not your own reading. If any is unapplied, go back and finish Step 5 first.

### Step 9: Check the written verdicts

If the untrack hook removed the record itself because every finding closed, skip this step, otherwise call `lagune_read` with `command` set to `validate` and `arguments` set to `["harden"]`, and if it reports problems, follow its output and rerun it until it passes.

### Step 10: Summarize

This summary is your report to the user, the phase's only outward output. Output a short summary:

- The scope you ran (all controls, named controls or paths, or priorities).
- The controls verified, each with its result (the icon and the risk in plain language) and a one-line note of how it was proven, highest priority first.
- The specializations you applied, if any, named plainly.
- What changed since the last run: verdicts added, verdicts on findings stood down because the control closed the risk, and verdicts that flipped.
- What was stood down this run, named plainly.
- Anything still open: each `❌ Reproved` control and the gap its `Reason` names, each `❓ Inconclusive` control and what would settle it, and any part of the scope the hardening record did not cover.
- If you suspected a new problem outside the recorded controls, tell the user to run `/lagune-detect` on that spot so it is mapped, planned, and hardened properly. Do not treat it as a verdict here.
- A suggested commit message, for example `docs: record control verification verdicts`.
- **Next step**, framed as a recommendation:
  - Any `❌ Reproved`: point to `/lagune-harden`, which re-runs against the `Reason` now on the block. If the plan never covered it, point to `/lagune-plan` (or `/lagune-detect` for an unmapped spot) first.
  - Any `❓ Inconclusive`: name what would settle it, then rerun `/lagune-verify`.
  - Everything closed and the chain now empty: the cycle is at rest, reopened only when the code changes.
  - Everything in scope closed but findings open elsewhere: this slice is at rest, name what is still open.

Keep the summary in plain language throughout. A non-developer should understand what was proven, how, and what still does not hold.

## Engine

Run every `lagune <subcommand>` call from the project root through the `lagune_read` and `lagune_write` MCP tools and, only if those tools are not available, run it in the shell as `npx --yes lagune@0.20.0 read <command> <arguments>` and `npx --yes lagune@0.20.0 write <command> <arguments>` as a fallback.
