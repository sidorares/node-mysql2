# [PROJECT_NAME] Defense Plan <!-- Example: the project's name followed by "Defense Plan" -->

- **Scope:** [SCOPE] <!-- Example: one of these, matching how it was run: all detect findings, or the named findings or paths, or the concern described -->
- **Planned:** [PLAN_DATE] <!-- Example: today's date in ISO format, such as 2026-06-11 -->

## Fixes

<!--
  One block per detect finding this plan acts on. The block's title is the finding's name, copied verbatim from the detect map (.lagune/memory/detect.md): the same name detect used, so this is the same item, traced by its title alone with no separate pointer line. Detect already recorded what the finding is and the risk it carries, so this plan does not restate the risk, it decides what to do about it and rates how serious it is. Read the detect finding for the why, read this block for the rating and the fix. The file path is not written here: it lives in Lagune's tracking map.

  "Category" names the risk class the finding maps to, and a CVE when one already exists (see the Rating guide at the foot of this file). "CVSS" and "Priority" are one rating, not two, both printed by the cvss hook: the CVSS v4.0 vector carries the score, and the Priority band is that score in plain words. "Why this priority" is one plain-language line for the Environmental metrics behind the band (how exposed the finding is, what is at stake), without restating the risk. "Upholds" links the fix to the charter principle it supports (.lagune/memory/charter.md), or several separated by commas when one fix supports more than one. Write "None directly" when there is no charter or no principle fits, and keep the fix. "Depends on" is optional: name another finding this fix must follow only when it truly cannot hold until that one lands first, since it sets the order to apply in, not the priority. "References" is optional: CWE or OWASP links grounding the category. When one finding needs more than one fix, write more than one paragraph under the block's "Fix", never a second block: one finding is one item, with one rating.

  This plan is reconciled, never append-only. On a re-run, re-check each existing block: keep it if its finding is still in the detect map and still unfixed, rewrite its rating and fix if the details changed, and remove it if detect shows the finding resolved or the code already applies the fix. Then add blocks only for what is genuinely new.
-->

### [FINDING_1_NAME]

<!-- Example: the detect finding's name, copied verbatim from detect.md so this is the same item. Do not rename it and do not add an action prefix like "Harden ". -->

- **Category:** [FIX_1_CATEGORY] <!-- Example: the risk class this finding maps to, and a CVE if one already exists for it, such as "Unrestricted file upload (CWE-434)" or "SQL injection (CWE-89)". Name the class alone when there is no CVE. -->
- **CVSS:** [FIX_1_CVSS] <!-- Example: the CVSS v4.0 vector with the score and band the cvss hook printed for it, such as "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N (9.3, Critical)". Reason the vector from the detect finding and the charter, never from a fresh code read. See the Rating guide at the foot of this file. -->
- **Priority:** [FIX_1_PRIORITY] <!-- Example: one of Critical, High, Medium, or Low. It is the band the cvss hook printed for the CVSS line above, not a free choice. -->
- **Why this priority:** [FIX_1_PRIORITY_RATIONALE] <!-- Example: "Anyone can reach the upload over the internet, and it sits on the server that holds customer files." One plain-language line for the Environmental metrics (exposure and stakes), without restating the risk detect already recorded. -->
- **Upholds:** [FIX_1_PRINCIPLE] <!-- Example: the charter principle this fix supports, such as "All input is untrusted until validated", or "None directly" when no charter is loaded or none fits -->
- **Depends on:** [FIX_1_DEPENDS_ON] <!-- Optional. Example: "User input validation", naming another finding this fix must follow. Omit this whole line when there is no real dependency. -->
- **Fix:** [FIX_1_CONTROL] <!-- Example: the control to apply, described not applied. For an unchecked upload: validate the file's real type and size, reject anything unexpected, rename it on save, and store it where it cannot be run as code. -->
- **References:** [FIX_1_REFERENCES] <!-- Optional. Markdown links grounding the category, comma-separated, such as "[CWE-434: Unrestricted Upload of File with Dangerous Type](https://cwe.mitre.org/data/definitions/434.html), [OWASP File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)". Write each as a `[label](url)` link, not a bare URL. Omit this whole line when there is nothing to cite beyond the class already named. Never invent a reference. -->

### [FINDING_2_NAME]

- **Category:** [FIX_2_CATEGORY]
- **CVSS:** [FIX_2_CVSS]
- **Priority:** [FIX_2_PRIORITY]
- **Why this priority:** [FIX_2_PRIORITY_RATIONALE]
- **Upholds:** [FIX_2_PRINCIPLE]
- **Fix:** [FIX_2_CONTROL]

### [FINDING_3_NAME]

- **Category:** [FIX_3_CATEGORY]
- **CVSS:** [FIX_3_CVSS]
- **Priority:** [FIX_3_PRIORITY]
- **Why this priority:** [FIX_3_PRIORITY_RATIONALE]
- **Upholds:** [FIX_3_PRINCIPLE]
- **Fix:** [FIX_3_CONTROL]

## Open questions

<!--
  Optional. List anything in scope that the detect map did not cover, so a later pass or the user can resolve it before a fix is planned with confidence. Remove this section if there are none.
-->

- [OPEN_QUESTION_ITEM] <!-- Example: a path or concern in scope that the detect map does not cover yet, so no fix is planned for it until detect maps it -->

<!--
  Rating guide for the Category, CVSS, and Priority fields above. This guide is instruction for whoever fills the plan. Delete it from the finished plan, it is not part of what the plan communicates.

  This phase never reads the code. Reason the rating from the detect finding and the charter alone, the only inputs this phase has. A fresh code read belongs to detect: a rating you cannot reason from what detect captured is a gap for detect to close, not grounds to open the source here.

  Name the Category the same way every run: the risk class the detect finding maps to (such as "SQL injection", "Prototype pollution", "Unrestricted file upload"), and a CVE identifier only if one already exists for it. When no CVE exists, name the class alone. Add the matching CWE in the Category or under References when it sharpens the class.

  Build the vector the same way every run, so two runs on the same finding land the same, then let the cvss hook score it: the CVSS field is the vector with the score and band it printed, and that band is the Priority.

  1. Base metrics (objective, reproducible): how the flaw is reached (AV, AC, AT, PR, UI) and what it harms (VC/VI/VA, SC/SI/SA), read from what detect recorded. This is the intrinsic severity of the flaw, independent of where it is deployed, and it assumes the worst case: every security requirement High and the flaw attacked in the wild.

  2. Environmental metrics (from charter and detect, do not read the code and do not re-ask the user): the same flaw lands higher or lower depending on this project, and these carry that in the vector itself. Append MAV only where this project reaches the flaw differently from its design, more narrowly (an internal tool, a local CLI, an adjacent network) or more widely. Append CR, IR, or AR as Medium or Low only where this project has less at stake there, which can only lower the score, since High is the default. A component guarding high-value assets (PII, payments, credentials, identity, core infrastructure), or a package many dependents rely on, keeps every requirement High. Move a band only through these metrics, on evidence from charter or detect, never on a scary category name, a vendor label, or a guess.

  3. Threat metrics stay out: the finding has no CVE, so EPSS, exploit maturity, and in-the-wild signals are unavailable. Leave E out of the vector, and do not invent or estimate it.

  A vector that scores 0.0 names a flaw with no impact, which has no fix to plan: route it back to detect.

  Plain-language anchors for the "Why this priority" line (say which one and why, in the project's terms), so the band stays legible to a non-developer:
  - Critical: an attacker reaches it directly and the damage is severe right now (run code or commands, take over an account, read or change the sensitive data this project holds), with little or nothing standing in the way. Drop everything and fix it first.
  - High: serious damage, but a condition must line up first (some access, a specific input, a step to chain), or the worst impact lands only on part of the system. Fix next, before normal work.
  - Medium: real but contained, harder to reach or limited in what it exposes. Fix soon.
  - Low: minor or unlikely in practice, narrow impact and easy to avoid. Fix when convenient.

  Honesty: never inflate to look thorough and never deflate to look clean. When a fact the rating needs is missing from detect and the charter (the version range, whether the surface is exposed, what data sits behind it), state the assumption you made in the "Why this priority" line, for example "rated as internet-facing because detect did not confirm the surface is internal", and where the gap is wide, record it under Open questions to route back to detect.
-->
