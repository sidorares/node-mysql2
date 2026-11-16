---
name: lagune-specialize
description: Specialize Lagune from a source or topic you give it, distilling it into a new on-demand specialization the detect and verify phases load later. It writes a focused, language-agnostic, defense-only knowledge module, never an exploit.
disable-model-invocation: true
argument-hint: Describe the security topic the specialization should cover, or name an existing specialization to refine
user-invocable: true
---

## User Input

<user-input>
  $ARGUMENTS
</user-input>

The User Input above decides how this command runs. Read it before proceeding. A placeholder left unfilled above is not the input: the User Input is then the words that came with this command, or empty when there are none.

## Outline

You are giving Lagune a new **specialty**: a focused, language-agnostic security specialization the detect and verify phases load on demand, listed by the catalog and loaded directly by calling `lagune_read` with `command` set to `catalog` and `arguments` set to `["<name>"]`. You distill the user's source or topic into it. A specialization audits and explains a risk area, it never rewrites the user's code, and it never produces an attack input. The shape lives in `template.md`, next to this file, and the built-in specializations `regex`, `javascript`, and `browser` are worked examples to mirror, each read as its file is written by adding `"--raw"` to `arguments`.

The result is the specialization at `.lagune/catalog/<name>.md` and its one-line entry in the project's index, the `catalog` list in `.lagune/configs.json`, which the catalog merges with the built-ins. You write both, and both stay under version control with the rest of `.lagune/`. You never touch the user's source.

### Step 1: Read the input

Take the User Input as the security source or topic to specialize in. It may be a pasted article or reference, or a short phrase such as "prototype pollution in our cache layer" or "GraphQL injection". If it is empty, ask the user what security concern the specialization should cover, then stop until they answer. Never invent a topic.

### Step 2: Defense-only gate

This command is defense only. If the topic asks for offensive tooling, a working exploit, an attack payload, or detection evasion, refuse and explain that a specialization audits and explains, it never produces an attack input. Dual-use content is acceptable only in a clearly defensive framing.

### Step 3: Settle the terrain and name, decide create or refine

First settle the **terrain**: what the specialization covers, never the vulnerability. The terrain is what the knowledge is about, and the attacks are what it teaches you to defend, so when the topic names an attack, settle on the surface that attack targets. For example, the built-ins set the rule: the regex specialization covers ReDoS, yet its terrain is `regex`, not `redos`. This same terrain is the title in Step 5 and the tags in Step 6, so name it once here.

The name is that terrain as a safe filename: lowercase, replace every run of characters outside `a-z 0-9 -` with a single `-`, trim leading and trailing `-`, and collapse repeats. Derive it from the terrain you settled, never from the raw topic, so an attack topic never becomes the name. If the terrain is unclear, ask the user for a short name for it. This name is also the identity of its entry in `.lagune/configs.json`.

List what the project already uses by calling `lagune_read` with `command` set to `catalog`. Then call it again with `arguments` set to `["<name>", "--raw"]`. It prints the specialization the project resolves under that name, its own first and then the built-in, or reports that no specialization has that name.

- **It exists** (a built-in like `regex`, or one you specialized before): this is a **refine**. Use what it printed as the base. Reconcile, never append: fold the new knowledge into the existing sections, keep what still holds, rewrite what changed, and preserve the file's shape. Never replace a built-in from scratch and never blindly clobber an earlier version.
- **It is new:** author from the template in Step 5.

### Step 4: Gather scope

In plain language, work out what the specialization must check, what distinguishes a real finding from a false one, and what the safer shapes are. Ask the user only what you need to author it well. Keep everything readable by a non-developer.

### Step 5: Author from the template

Fill in `template.md`, next to this file:

- Set the `# [SPECIALIZATION_DOMAIN] vulnerabilities` title to the terrain you settled in Step 3.
- Keep the purpose line, the two rules under `## Rules`, and the detect/verify shape under `## How to act on the result` verbatim. Each phase reads only the guidance under its own lead and every other reader reads neither, so keep the knowledge itself under `## What to look for`.
- **Credit the source, when there is one.** If the material the user gave you has an identifiable origin (an article title, an author, a link, a standard), keep the optional `> - Source: ...` quote and fill it with a short plain credit. If the input was just a topic, or has no attributable source, drop that line entirely. Never invent a source.
- Under `## What to look for`, add one `### ` block per risk class in scope, each in plain language: what the dangerous pattern is, why it matters, and how to make it safe (the `Safer shape:` line, or the bullet list / `#### Common safer shapes` variants the template's comments allow). Where a popular control is commonly mistaken for the fix, add the optional `Does not close it:` line, naming that decoy and why it leaves the risk open so it is never accepted as closing the finding. It may reference an existing deterministic hook only if one genuinely fits, never invent a new hook.
- **Close on what the repository shows.** Give the verify guidance only conditions verify can read in the repository's code and configuration. Anything outside it, such as a rotation, a deployed setting, a live scan, or a runtime test, never keeps a finding open: the detect guidance records it under Not determined as a side quest, and verify's summary points at it.

On a refine, apply these to the existing file rather than a blank one. Write no frontmatter: the tags live in the index, not the `.md`.

### Step 6: Propose tags, the user confirms

Derive 2 to 4 tags by the same terrain principle as the name (Step 3): the terrain or ecosystem the specialization lives in, an abbreviation, its variation, the plain name, never the vulnerability itself. The built-ins set the shallow style: `regex` carries `RegExp`, `Regular Expression`; `javascript` carries `JavaScript`, `Node.js`, `Deno`, `Bun`; `browser` carries `Browser`, `DOM`, `Navigator`. Propose a flat list of candidate tags and let the user add and drop any freely, never a fixed set to pick one from. On a refine, start from the existing entry's tags and reconcile them the same way.

### Step 7: Write the files

- Ensure `.lagune/catalog/` exists, then write `.lagune/catalog/<name>.md` with the authored or reconciled content. An existing name is reconciled from its current content first, so this never discards a built-in or an earlier version unseen. On a refine of a built-in, this file becomes the project's own version and shadows the built-in from then on.
- Update `.lagune/configs.json`. If the file or its `catalog` list is absent, create it. If the file names no `$schema`, add `"$schema": "https://lagune.ai/schemas/configs.json"` as its first field. Add the `{ "name": "<name>", "tags": [...] }` entry to that list, or on a refine rewrite that one entry, preserving every other entry and every other field untouched.
- Call `lagune_read` with `command` set to `catalog` again and confirm it lists the entry with the tags the user confirmed.

### Step 8: Summarize

In plain language, tell the user the specialization's name, its tags, what it covers, and that the detect and verify phases now load it on demand (and they can load it directly with `npx --yes lagune@0.20.0 read catalog <name>`), mentioning it shadows any built-in of the same name on a refine. Suggest a commit message such as `feat: specialize Lagune in <name>`. Say it as a suggestion, not a mandate.

## Engine

Run every `lagune <subcommand>` call from the project root through the `lagune_read` and `lagune_write` MCP tools and, only if those tools are not available, run it in the shell as `npx --yes lagune@0.20.0 read <command> <arguments>` and `npx --yes lagune@0.20.0 write <command> <arguments>` as a fallback.
