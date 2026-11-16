# [PROJECT_NAME] Hardening Record <!-- Example: the project's name followed by "Hardening Record" -->

- **Scope:** [SCOPE] <!-- Example: one of these, matching how it was run: all plan fixes, or the named fixes or paths, or the chosen priorities -->
- **Hardened:** [HARDEN_DATE] <!-- Example: today's date in ISO format, such as 2026-06-11 -->

## Applied

<!--
  One block per detect finding this phase acted on, taken from the defense plan (.lagune/memory/plan.md). The block's title is the finding's name, copied verbatim, the same title the plan used, so it is the same item, traced by its title alone with no separate pointer line. The plan decided the WHAT, this record captures the WHAT WAS DONE: the control applied to the code, where it landed, and whether it is fully in place. The Where note says the area the change landed in, not the file path: the path lives in Lagune's tracking map.

  Each block carries a Status owned by harden, and a Verdict and Reason owned by verify:
    - Status (harden): Applied (the control is fully in place), Partial (some of it is in place, the rest under Remaining), or Blocked (it could not be applied, with the reason under Blocker, and the plan fix stays open).
    - Verdict (verify): Pending until verify judges it, then ❌ Reproved (the risk is still open) or ❓ Inconclusive (the code does not settle it). A proven-closed finding is stood down, so its block is removed and never carries a verdict. Harden only ever resets this to Pending when it re-applies the block.
    - Reason (verify): one or two lines on why the risk is open or what is missing, required for ❌ Reproved and ❓ Inconclusive, omitted when Pending. Harden reads it on a re-run to know what to re-apply.

  This record is reconciled, never append-only. On a re-run, re-check each block against the current code: keep it if the change still holds, rewrite it if the code moved on, and remove it if the plan no longer carries that finding or the change was reverted. Then add blocks only for findings newly hardened.
-->

### [FINDING_1_NAME] <!-- Example: the detect finding's name, copied verbatim from the plan and detect.md so this is the same item. Do not rename it and do not add an action prefix. -->

- **Status:** [APPLIED_1_STATUS] <!-- Example: one of Applied, Partial, or Blocked -->
- **What changed:** [APPLIED_1_CHANGE] <!-- Example: the change made, in plain language. For an upload: added real file-type and size validation, rejected anything unexpected, randomized the saved filename, and moved the directory to where it cannot be run as code. -->
- **Where:** [APPLIED_1_EVIDENCE] <!-- Example: a short, plain-language note of where the change landed (the function or area) and any dependency added, such as "the handleUpload function, plus the file-type library added". Name the area, not the file path: the path lives in the tracking map. -->
- **Verdict:** [APPLIED_1_VERDICT] <!-- Verify owns this (see the block comment above). Harden writes only Pending. -->
- **Reason:** [APPLIED_1_REASON] <!-- Verify owns this. One or two lines on the gap, omitted when Pending. -->

### [FINDING_2_NAME]

- **Status:** [APPLIED_2_STATUS]
- **What changed:** [APPLIED_2_CHANGE]
- **Where:** [APPLIED_2_EVIDENCE]
- **Verdict:** [APPLIED_2_VERDICT]
- **Reason:** [APPLIED_2_REASON]

### [FINDING_3_NAME]

- **Status:** [APPLIED_3_STATUS]
- **What changed:** [APPLIED_3_CHANGE]
- **Where:** [APPLIED_3_EVIDENCE]
- **Verdict:** [APPLIED_3_VERDICT]
- **Reason:** [APPLIED_3_REASON]

## Remaining <!-- Optional. List anything left to finish: the rest of a Partial fix, a Blocked fix and why it is stuck, or a plan fix this run did not reach. Each item names the plan fix it belongs to, so the plan and this record stay in step. Remove this section if every in-scope fix is fully Applied. -->

- [REMAINING_ITEM] <!-- Example: a plan fix that is Partial or Blocked, naming the fix and why it is not fully Applied (for instance, a dependency it needs is missing, or part of the change could not be made safely yet), so the fix stays open -->
