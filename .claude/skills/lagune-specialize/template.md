# [SPECIALIZATION_DOMAIN] vulnerabilities <!-- Example: the domain this specialization covers followed by "vulnerabilities", such as "Browser / client-side vulnerabilities", "JavaScript-specific vulnerabilities", or "Regex-specific vulnerabilities". The domain is the terrain the knowledge is about, never the vulnerability itself: it matches the specialization's name (a "Regex" domain, not "ReDoS"), and when the topic was an attack, it names the surface that attack targets. -->

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list. <!-- Keep this line verbatim. Every specialization opens with it. -->
> - Source: [SOURCE_CREDIT] <!-- Optional second quote. Add it only when the material this specialization was distilled from has an identifiable source worth crediting (an article title, an author, a link, a standard). Keep it to a short plain credit, such as "Source: OWASP, 'Server-Side Request Forgery Prevention Cheat Sheet'." or "Source: <https://example.com/article>". Omit this line entirely when the input was just a topic or has no attributable source. -->

## Rules

- This specialization audits and explains.
- By default, it never rewrites your code.

<!-- Keep the two rules above verbatim. They are the same in every specialization. -->

## What to look for

<!--
  One ### block per vulnerability this domain carries. Each is a self-contained risk the agent checks against the code in scope, one at a time. The block's title is the vulnerability's name, and it is the section's identity. Order the vulnerabilities however reads best for the domain. A domain with a single risk has a single ### block (see the regex specialization). Write freeform security prose, not [TOKEN] fields: the placeholders below mark where your prose goes, the shape is the convention to follow.

  Each block states, in plain language: what the dangerous pattern is (the named sinks, calls, or constructs and the sources that reach them), why it matters (the concrete impact), and how to make it safe. The common form is one inline "Safer shape:" note, but it varies (see the comment on that line). Where a popular control is commonly mistaken for the fix, an optional "Does not close it:" note names that decoy so it is not accepted as closing the finding (see the comment on that line).
-->

### [VULN_1_NAME] <!-- Example: a short name for the vulnerability class, such as "DOM-based XSS", "Prototype pollution", or "ReDoS (Regular expression Denial of Service)" -->

[VULN_1_WHAT] <!-- Example: the dangerous pattern in plain language: the sinks, calls, or constructs that are unsafe, and the untrusted sources that reach them. Such as "The DOM sinks execute markup from their input: innerHTML, document.write, ... Any of these fed by a value from outside the code is XSS." -->

Safer shape: [VULN_1_SAFER] <!-- The common case: one inline "Safer shape:" line giving the defensive form (such as "write text through textContent, build nodes with createElement/append, and keep untrusted values out of HTML-parsing sinks"), with the lead-in kept literal. It is not mandatory. When a vulnerability has more than one safer form, write "Safer shapes, applied where they fit:" followed by bullets (as the javascript specialization does for prototype pollution), or move them into a "#### Common safer shapes" subsection (as the regex specialization does). Where the only guidance is to remove the pattern, fold it into the prose above and drop this line. -->

Does not close it: [VULN_1_DECOY] <!-- Optional. One inline "Does not close it:" line naming the decoy that looks sufficient but leaves the risk open, and why, such as "a host blocklist. It filters the URL text while the client connects to a resolved number, so one encoded form always slips past. Allowlist instead." Keep the lead-in literal and pair it with the risk it qualifies. Write it only when a reader would plausibly accept the decoy as closing the finding, and omit it otherwise, exactly like "Safer shape:". It names a control that is NOT enough, so the finding stays open. Never use it for the opposite case, a shape that looks unsafe but is actually safe. -->

#### [VULN_1_TOOL_STEP] <!-- Optional. Add #### subsections when the vulnerability is backed by a deterministic check, a multi-step procedure, or a set of safer shapes worth their own list. The regex specialization uses three: "How to check a pattern", "How to read the verdict", and "Common safer shapes". Remove this subsection when the prose above is enough. -->

[VULN_1_TOOL_DETAIL] <!-- Example: how to run the check and how to read its result, such as the command to run and what each verdict means. Omit entirely for vulnerabilities a reader judges by eye. -->

### [VULN_2_NAME] <!-- A block may chain more than one risk/safer-shape pair when they are variations of one theme: state the first pattern with its "Safer shape:", then the next pattern with its own, as the javascript specialization does under "Remote code execution" for eval/Function and then subprocess. -->

[VULN_2_WHAT]

Safer shape: [VULN_2_SAFER]

### [VULN_3_NAME]

[VULN_3_WHAT]

Safer shape: [VULN_3_SAFER]

## How to act on the result

- **In detect (detection):** [DETECT_GUIDANCE] <!-- Example: each pattern you confirm is a finding. Describe it in plain language: what it is (the behavior being abused), why it matters (the concrete impact), and the evidence (the function or area where it lives). It flows through detect's normal steps and is tracked like any other finding. Where part of the control lies outside the repository, also record a side quest under Not determined asking whether that part holds, named by what it covers and never by the finding's name, so it outlives the finding. -->
- **In verify (proof):** [VERIFY_GUIDANCE] <!-- Example: the control holds only when the unsafe pattern is gone or properly guarded. Anything outside the repository (a rotation, a deployed setting, a live scan, a runtime test) never keeps the finding open, not even as inconclusive: point the summary at detect's side quest for it instead. If the dangerous pattern still reaches untrusted input, the risk is not closed: record it as such and point back to harden. -->
