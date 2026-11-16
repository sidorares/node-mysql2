# [PROJECT_NAME] Detect Map <!-- Example: the project's name followed by "Detect Map" -->

- **Scope:** [SCOPE] <!-- Example: one of these, matching how it was run: a full project scan, or the specific paths given, or the focus described -->
- **Mapped:** [DETECT_DATE] <!-- Example: today's date in ISO format, such as 2026-06-11 -->

## Findings

<!--
  One block per thing the system actually does that carries security weight. What carries weight depends on what the project is: a web service (login, uploads, payments, database access), a library or package (the public API surface, deserialization, command execution), a CLI or script (the arguments and files it reads, the commands it shells out to), a desktop or mobile app (local storage, update channel, device permissions). Detect from the project at hand, not from a fixed list. Each finding has three parts, in plain language for any reader, plus an Evidence note that says where the finding lives without naming the file path. The finding's name (this block's title) is its identity: plan, harden, and verify each reuse it verbatim as their own section title, so the same item is traced by that one name across every phase. Keep each finding's name unique in the map. The file path is not written here: it lives in Lagune's tracking map, which keeps it current through a rename. This is detection, not invention. Only record what the code actually supports.

  This map is reconciled, never append-only. On a re-run, re-check each existing finding against the current code: keep it if it still holds, rewrite it if it changed, and remove it if the code shows it is resolved or no longer applies. Then add blocks only for what is genuinely new.
-->

### [FINDING_1_NAME] <!-- Example: a short name for what was detected, such as "File uploads", "Command-line arguments", "Deserialization", or "Local credential storage", depending on the project -->

- **What it is:** [FINDING_1_SUMMARY] <!-- Example: a plain-language description of what the system does here, such as "The system accepts files uploaded by users" or "The CLI passes its argument straight to a shell command" -->
- **Why it matters:** [FINDING_1_RISK] <!-- Example: the risk it carries, in plain language: what could go wrong, not just the fact. For an unchecked upload, a file disguised as an image could become code execution. For an unescaped CLI argument, an attacker could inject their own command. -->
- **Evidence:** [FINDING_1_EVIDENCE] <!-- Example: a short, plain-language note of where the finding lives, such as "the makeThumbnail function, which builds a shell command from the name" or "the GET /thumb route". Name the function or area, not the file path: the path lives in the tracking map. -->

### [FINDING_2_NAME]

- **What it is:** [FINDING_2_SUMMARY]
- **Why it matters:** [FINDING_2_RISK]
- **Evidence:** [FINDING_2_EVIDENCE]

### [FINDING_3_NAME]

- **What it is:** [FINDING_3_SUMMARY]
- **Why it matters:** [FINDING_3_RISK]
- **Evidence:** [FINDING_3_EVIDENCE]

## Applied specializations <!-- Optional. The specializations you applied this run, each with the finding(s) it surfaced. List only the ones that applied. Reconcile with the findings: a specialization drops off when every finding it produced is gone. Remove this section if none applied. -->

- [SPECIALIZATION_NAME]: [SPECIALIZATION_CONTRIBUTION] <!-- Example: "regex: the ReDoS-prone validator under 'Email validation'". Name the specialization as the catalog lists it, and name the findings by their titles above. -->

## Not determined <!-- Optional. List anything the scope asked about that the code did not make clear, so a later pass or the user can resolve it. Remove this section if everything in scope was determined. -->

- [UNDETERMINED_ITEM] <!-- Example: something the code left unclear, such as whether stored data is reachable from outside, that could not be confirmed from what was read alone -->
