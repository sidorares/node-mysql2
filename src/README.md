# `src`: the TypeScript transcription of MySQL2

`src` is the TypeScript transcription of the shipped JavaScript (the two entry points and `lib`), developed in parallel while that JavaScript remains what users install. Nothing in `src` is published, covered by the regular CI, or loaded at runtime until the community declares the transcription complete.

Context: [#2803](https://github.com/sidorares/node-mysql2/issues/2803) and [#3695](https://github.com/sidorares/node-mysql2/issues/3695).

## Rules

1. **Runtime behavior never changes.** The built output must do exactly what the JavaScript does today: same exports, same lazy loading, same errors, same event order, same performance. Types describe the code, they do not redesign it.
2. **Mirror the layout by default.** Each shipped file gets a TypeScript twin at the same path under `src`. Deviate only when TypeScript or the build requires it, and say why in the pull request.
3. **Transcribe, do not refactor.** Keep names, structure and statement order. A bug found while transcribing is fixed in the shipped JavaScript first, through a regular pull request to `master`, then ported.
4. **No `any`, no double casts.** Use `unknown` and narrow it. Prefer `type` over `interface`, and named exports over default exports, so the emitted CommonJS keeps the flat `exports` shape users rely on.
5. **Imports carry the `.js` extension**, the way the built output resolves them. Biome enforces it.
6. **Ambient declarations for dependencies without typings live in `src/types`.** Keep them faithful to how the shipped code uses each package, nothing more.
7. **`typings` remains the public type contract until the switch.** When it disagrees with `src`, the mismatch is a finding to discuss in the pull request, not something to paper over.

## Build

The build emits to `dist`, git-ignored, mirroring the repository root: the two entry points, `lib`, and a declaration file next to each module. Class fields compile to constructor assignments, matching the JavaScript.

| Setting        | Value    | Why                                                                                                                                              |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `target`       | `es2020` | Node.js 14 is the real runtime floor and ES2020 is the newest syntax it runs natively, so nothing the JavaScript already uses gets down-leveled. |
| `module`       | `node16` | With the package declared as CommonJS, every file compiles to CommonJS, and Node.js, Bun and Deno keep loading the same module format.           |
| `declaration`  | `true`   | The emitted declarations become the type contract at the switch.                                                                                 |
| `sourceMap`    | `false`  | Open decision: maps help debugging but add package size. Revisit before the switch.                                                              |
| `skipLibCheck` | `true`   | `aws-ssl-profiles` ships a declaration file the compiler rejects. Fixing it upstream lets this go back to `false`.                               |

## Commands

```sh
npm run src:typecheck
npm run src:build
npm run src:test          # Node.js
npm run src:test:bun
npm run src:test:deno
```

`npm run lint` already covers `src`.

## Transcribing a file

1. Pick a file, starting from the leaves (constants, packets, parsers) and moving up to the connection, the promise wrapper and the entry points.
2. Create its twin in `src` and transcribe it statement by statement.
3. Run the typecheck and the linter.
4. Open a pull request against `js-to-ts`, one file or one small directory each.

## Keeping up with `master`

`master` keeps changing the shipped JavaScript while the transcription happens here. Merge it into `js-to-ts` regularly. Since `src` and the shipped files never overlap, the merge never conflicts, it only brings changes the transcribed files may not reflect yet. Before merging, list what changed:

```sh
git fetch origin
git diff --stat HEAD...origin/master -- index.js promise.js lib
```

Merge, then port each change to its twin in `src`. Files not transcribed yet need nothing, since they will be transcribed from the current JavaScript later.

## Testing

The existing test suite, unchanged, is the acceptance test. The `src:test` scripts build `dist`, copy the tests next to it and run them there, so every relative import in a test resolves to the built output instead of the shipped JavaScript. `FILTER` works as usual, a MySQL server is needed as for `npm test`, and the run only makes sense once the entry points and everything they import exist in `src`.

The dedicated workflow typechecks and builds `src` on every pull request that touches it, then loads the built entry points on Node.js 14 through 24 once they exist. The regular workflows never look at `src`.

## Known questions

- The callback entry point exposes part of its API through lazy getters, so the promise API is not loaded eagerly and the module graph stays free of cycles, which the circular-import check enforces. ES module syntax has no lazy export, so the transcribed entry points need an explicit CommonJS getter and a lint exception for it.
- Named placeholders are loaded lazily on first use. The transcription must keep that.
- The row parsers generate code from strings. The generated source stays untyped by nature: type the generator inputs and the returned function, nothing inside the string.

## The switch

When `src` is complete, one pull request makes the built output the shipped code:

1. Point the build output at the repository root. It then writes the entry points and `lib` exactly where they are today, so the package manifest, coverage, CodeQL and every test import keep working unchanged.
2. Delete the JavaScript sources from git, ignore the generated paths, and build before packing.
3. The emitted declarations become the type contract. Remove the hand-written typings and the manual compile checks: compiling `src` in its approved state is the type test.
4. Fold the `src` scripts and workflow into the regular ones and delete the helper tools.
5. Release as a major version, with a changelog entry stating that runtime behavior is unchanged.
