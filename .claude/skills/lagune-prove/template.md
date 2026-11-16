# [FINDING_NAME] <!-- The detect finding's name, verbatim and identical to its section title in the detect map, so this advisory traces back to the finding by name. -->

> This is a defensive proof for responsible disclosure: an automated regression test that asserts the safe behavior and fails while the issue is live. It is not an exploit. <!-- Keep this framing line. Every advisory opens with it. -->

<!--
  This advisory is self-contained on purpose: the user may paste it into a private GitHub Gist per vulnerability, where there is no parent README and no sibling files. Do not reference the proofs index or other findings here. The only outward pointer is the run command for this finding's own test. Write every part in plain language a non-developer can act on. Fill every placeholder and leave no bracket token behind.
-->

- **Severity:** [SEVERITY] <!-- One of Critical, High, Medium, or Low, followed by one plain-language clause on why it sits there. It is the band the cvss hook printed for the CVSS line below. Rate it by the method in the Rating guide at the foot of this file. -->
- **Category / CVE:** [CATEGORY_OR_CVE] <!-- Example: the risk class it maps to (such as "SQL injection" or "Prototype pollution"), and a CVE identifier if one already exists for it. If there is no CVE, name the class alone. -->
- **CVSS:** [CVSS] <!-- The vector behind the Severity band, followed in parentheses by the score and band the cvss hook printed for it, for example "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N (9.3, Critical)". See the Rating guide at the foot of this file. -->
- **Affected:** [AFFECTED] <!-- Example: the affected component and version range, such as "acme-uploads, all versions up to and including 1.4.2". Read it from the project's manifest (package.json name and version) and the finding's location. If the version range cannot be determined from the code, name the component and say the range is unconfirmed rather than guessing. -->

## Impact

[IMPACT] <!-- Example: in plain language, what an attacker gains while the issue is live, and who is affected. State the concrete consequence, not just the mechanism. -->

## Proof of Concept

[POC] <!-- One or two plain sentences naming the entry point the reproduction takes. The code below carries the proof, not this prose. Keep it short. -->

```[LANGUAGE]
[POC_CODE] <!--
  A runnable, self-contained reproduction through the attacker's real entry point. A reviewer copies this block, runs it, and sees the issue with their own eyes. It is derived from the test you already wrote (write the test first, it is the evidence), then rendered as the path a real attacker reaches the issue through.

  Three hard requirements, all mandatory:

  1. It enters where the attacker enters. The reproduction goes through the same entry point a real attacker uses: the public API, the exposed route, the connection, the query the hostile server answers. It NEVER reaches into internal modules the attacker cannot call. Importing a backend file and hand-building an internal packet is how the regression test proves the fix, not how an attacker reaches the bug, so it is not a proof of concept. When the issue needs a hostile input, stage that condition through a legitimate mechanism of that same entry point (for a database, a self-referential query the local server answers so the server itself returns the crafted field; for a route, the crafted request sent to it), never by calling internals directly.

  2. It runs as-is and shows the symptom through its own output. No remote host, no "attacker-controlled-host", no service the reader must stand up. End with a real statement that prints or returns the observable effect (the polluted prototype, the value that leaked, the guard error that failed to fire), so running the block produces the evidence on screen. A line like "// here the server would return X" proves nothing and is forbidden. Every value is concrete: the actual crafted input, the actual query, the actual logged result, never a placeholder or a narrated "imagine that".

  3. It is a reproduction, not a weapon. It demonstrates the vector to a maintainer who must accept the report. It is not a packaged payload aimed at a third party, and it carries no destructive step.

  If you cannot build this, there is no proof of concept, and without it there is no advisory: a report without the proof is a suspicion, not a proven finding. Do not fall back to an internal-path reproduction or a narrated comment to fill the block. Drop the finding instead, leave no directory for it, and report it to the user as not proven through a real entry point.
-->
```

Run the regression proof:

```sh
[RUN_COMMAND] <!-- The command that runs this finding's test, matching the runner used, such as "node --test .lagune/proofs/<slug>/report.test.mjs" for the native Node.js runner, or "node .lagune/proofs/<slug>/report.test.mjs" when the project uses Poku. It fails while the issue persists and passes once the code is fixed, so a passing run is the evidence the risk is closed. -->
```

## How it reproduces

[REPRO] <!-- Example: what the test exercises and what the safe behavior should be. Describe the input and the expected secure outcome, so a reader understands what the proof checks without reading the code. -->

## Possible fix

[FIX] <!-- A theoretical direction for the fix, one or two sentences, direct and to the point, the opposite of the runnable detail the Proof of Concept carries. Name what the secure behavior should be (apply the guard to the joined key, not each piece; encode the parameter; reject the path before it is used), not a patch. This is a pointer for the maintainer, not an applied or verified fix: applying and proving the fix is the job of `/lagune-harden` and `/lagune-verify`, never this command. Write no code here. -->

## References <!-- Optional. Add links that give the reviewer context, such as the CWE page for the category, an OWASP cheat sheet, or the source the finding was distilled from. One per line. Remove this whole section when there is nothing to cite beyond the category already named above. Never invent a reference. -->

- [REFERENCE] <!-- Example: "CWE-78: OS Command Injection, https://cwe.mitre.org/data/definitions/78.html" -->

<!--
  Rating guide for the Severity and CVSS fields above. This guide is instruction for whoever fills the advisory. Delete it from the finished advisory, it is not part of what the user discloses.

  Build the vector the same way every run, so two runs on the same flaw land the same, then let the cvss hook score it: the CVSS field is the vector with the score and band it printed, and that band is the Severity.

  1. Base metrics (objective, reproducible): how the flaw is reached (AV, AC, AT, PR, UI) and what it harms (VC/VI/VA, SC/SI/SA). This is the intrinsic severity of the flaw, independent of where it is deployed, and it assumes the worst case: every security requirement High and the flaw attacked in the wild.

  2. Environmental metrics (from charter and detect, do not re-ask the user): the same flaw lands higher or lower depending on this project, and these carry that in the vector itself. Append MAV only where this project reaches the flaw differently from its design, more narrowly (an internal tool, a local CLI, an adjacent network) or more widely. Append CR, IR, or AR as Medium or Low only where this project has less at stake there, which can only lower the score, since High is the default. A component guarding high-value assets (PII, payments, credentials, identity, core infrastructure), or a package many dependents rely on, keeps every requirement High. Move a band only through these metrics, on evidence from charter or detect, never on a scary category name, a vendor label, or a guess.

  3. Threat metrics stay out: this advisory is pre-disclosure and private, so the finding has no CVE, and EPSS, exploit maturity, and in-the-wild signals are unavailable. Leave E out of the vector, and do not invent or estimate it.

  Plain-language anchors for the clause (say which one and why, in the project's terms):
  - Critical: an attacker reaches it directly and the damage is severe right now (run code or commands, take over an account, read or change the sensitive data this project holds), with little or nothing standing in the way.
  - High: serious damage, but a condition must line up first (some access, a specific input, a step to chain), or the worst impact lands only on part of the system.
  - Medium: real but contained, harder to reach or limited in what it exposes.
  - Low: minor or unlikely in practice, narrow impact and easy to avoid.

  Honesty: never inflate to look thorough and never deflate to look clean. When a fact the rating needs is missing (the version range, whether the surface is exposed, what data sits behind it), state the assumption you made in the clause, for example "rated as internet-facing because detect did not confirm the surface is internal".
-->
