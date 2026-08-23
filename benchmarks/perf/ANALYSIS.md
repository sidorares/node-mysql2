# MySQL2 performance analysis

_August 2026 · Node.js 26.0.0 (V8 13.x) · Apple M1 Pro, 16 GB · MySQL 8.3 and 9 in Docker · branch `claude/library-performance-analysis-d4d3b6`_

This document covers: the benchmark methodology, where CPU/GC time actually goes per workload, ten validated prototype patches (all 226 test files pass), the measured wins, the ideas that **don't** work on modern V8, and a ranked list of remaining opportunities.

---

## 1. Methodology

Two complementary harnesses live in `benchmarks/perf/`:

**E2E (`e2e.js`, real server).** Scenarios against Docker MySQL 8.3 (`:3308`) and 9 (`:3309`): single-row insert loop, 1 row, 100 rows × 10/100 cols, 10k/100k/1M-row scans, datetime-heavy scans, `query()` vs `execute()`. Each scenario runs in a fresh Node process (clean JIT/GC state), warmup by time, then a measured window reporting ops/s, p50/p95 latency, process CPU%, and GC pauses via `PerformanceObserver('gc')`.

**Isolated replay (`capture.js` + `replay.js`, no server).** `capture.js` records the exact server→client byte stream (including real socket chunk boundaries) for each query once. `replay.js` then feeds those bytes through the real client receive path — `PacketParser` → command state machine → compiled row parsers — with a stubbed connection. This measures pure client CPU with zero server/network variance, and allows re-chunking the same bytes to study chunking effects.

Why both: e2e small-query latency in Docker is RTT/fsync-bound (client CPU is 8–30%), so client-side improvements barely move e2e latency numbers while still cutting CPU per query — which is what matters under concurrency. Replay ops/s is the reliable client-side metric; e2e CPU% corroborates it. E2E large-scan numbers have high run-to-run variance (server shares the same machine); treat ±10% as noise there.

Supporting tools: `profile-summary.js` aggregates `--cpu-prof` output by self-time; `micro-decode.js` compares candidate implementations for the hot primitives; `run-all.sh` runs the matrix.

## 2. Where the time goes (baseline profiles)

Self-time shares of representative replay scenarios, current release code:

| Workload                                | Dominant costs                                                                                                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1M rows × 3 cols (INT, VARCHAR, DOUBLE) | GC 28% · string decode (`utf8Slice`+`toString`+wrappers) ~29% · per-row dispatch (`Query.row`+`Command.execute`) ~19% · text-float parse 8%                                |
| 100k rows × 10 cols (half VARCHAR)      | **string decode ~52%** · GC 18% · int parse 7%                                                                                                                             |
| 100k rows × DATETIME/TIMESTAMP/DATE     | **date parsing 62%** (`new Date(string)`) · GC 12%                                                                                                                         |
| 100-row queries (per-query overhead)    | **`Packet.MockBuffer` 21%** · lazy column-def getters (`Object.defineProperty`) 5–15% · parser-cache key (`JSON.stringify`) ~10% · promise stack capture ~12% of busy time |

Two structural observations:

- **`execute()` was slower than `query()`** on wide rows (599 vs 843 ops/s e2e at 100×100) because the generated binary row parser called `wrap(fields[i], packet)` — allocating a metadata object plus three closures — per column per row **even when no `typeCast` function is configured**.
- **Every `query()` on MySQL 8+ paid a double serialization**: with `CLIENT_QUERY_ATTRIBUTES` negotiated, `Query.toPacket()` always did a dry-run serialization against `Packet.MockBuffer()`, and `MockBuffer()` itself rebuilt a patched Buffer (a `for…in` over `Buffer.prototype`) on every call.

## 3. Validated changes (prototyped in this branch)

All changes are pure JS, guarded for portability (no Node-internal dependency without fallback), and pass the full suite (226 files), lint, and typecheck. Ordered by measured impact:

1. **`Query.toPacket` fast path** (`lib/packets/query.js`, `lib/packets/packet.js`). With no query attributes (the overwhelmingly common case) the packet length is known upfront: allocate once, write the SQL directly into the packet buffer (`buffer.write`), skip the dry run entirely; memoize `MockBuffer` for the attribute path. _This alone was ~5× on the isolated `SELECT 1` loop._
2. **Binary parser: no `wrap` allocation without `typeCast`** (`lib/parsers/binary_parser.js`). One-line move of the wrapper emission inside the `typeof options.typeCast === 'function'` branch. _e2e 100×100 execute: 599→966 ops/s at that point in the series; execute() now beats query() as it should._
3. **Text DATE/DATETIME digit parsing** (`lib/packets/packet.js`). `parseDateTime` now parses `YYYY-MM-DD HH:MM:SS[.ffffff]` digits straight from the buffer — no intermediate string, no `new Date(string)` slow path — with fallback to the old path for non-standard shapes, zero-date and year<100 edge cases preserved (verified value-identical across timezones incl. `+HH:MM` offsets, which use a memoized offset instead of string concatenation). Micro: `new Date(str)` 221ns → digit parse + `new Date(y,…)` 155ns → `Date.UTC` path 35ns.
4. **Column definition lazy getters without `Object.defineProperty`** (`lib/packets/column_definition.js`). First access now caches into a prototype-declared `_nameValue` slot; `defineProperty` per column per query is gone. (These getters fire on _every_ query — the parser-cache key reads `field.schema`/`field.table`.)
5. **Parser cache key without per-field `JSON.stringify`** (`lib/parsers/parser_cache.js`). Options head stays `JSON.stringify` (fixed size, preserves normalization semantics); the O(columns) part is hand-built with length-prefixed strings (collision-safe, no throwaway nested arrays).
6. **String decode fast paths** (`lib/parsers/string.js`). `utf8Slice`/`latin1Slice`/`asciiSlice` called directly (skipping `toString`'s per-call encoding normalization and `Buffer.isEncoding`), feature-detected with `toString` fallback for other runtimes, with explicit clamping to preserve `toString`'s out-of-range semantics.
7. **Per-row dispatch caching** (`lib/commands/query.js`, `execute.js`). `_currentRows`/`_currentFields` cached at resultset start instead of `this._rows[this._resultIndex]` twice per row.
8. **Packet-object reuse in `PacketParser`** (`lib/packet_parser.js`, `lib/base/connection.js`). Complete packets are delivered through one mutable `Packet` instance (a 1M-row result no longer allocates 1M of them); a paused connection `clone()`s before queueing. ⚠️ This changes the internal `onPacket` contract — consumers retaining packets past the synchronous callback must clone (the packet-parser unit test was updated accordingly). Worth making explicit if adopted.
9. **`Long`-free int64 reads** (`lib/packets/packet.js`). `readInt64JSNumber`/`readSInt64JSNumber`/`readInt64`/`readSInt64` compute the JS number directly (verified bit-identical against `Long` over randomized 64-bit values); `Long` is only constructed when an exact string is actually needed.
10. **Promise stack capture respects `trace: false`** (`lib/promise/connection.js`, `pool.js`). The promise wrapper captured an `Error` stack per query unconditionally (~10% of small-query client CPU) despite the existing `trace` config option. Now gated. Default behavior unchanged.

### Measured results (isolated replay, client CPU only)

| Scenario            | Baseline    | Patched                      | Δ        |
| ------------------- | ----------- | ---------------------------- | -------- |
| `SELECT 1` loop     | 40.7k ops/s | **250k ops/s**               | **6.1×** |
| 1 row × 10 cols     | 28.3k       | **96.9k**                    | **3.4×** |
| 100 rows × 10 cols  | 12.9k       | 22.1k                        | +71%     |
| 100 rows × 100 cols | 1 718       | 2 209                        | +29%     |
| 10k rows × 3 cols   | 743         | 802 (8.0M rows/s)            | +8%      |
| 100k rows × 3 cols  | 59.1        | 69.5                         | +18%     |
| 1M rows × 3 cols    | 4.57        | 5.30 (5.3M rows/s, 157 MB/s) | +16%     |
| 100k datetime rows  | 10.2        | 14.3                         | +40%     |
| 100k rows × 10 cols | 18.2        | 20.9 (234 MB/s)              | +15%     |

### Measured results (e2e, MySQL 8.3, same machine)

| Scenario                | Baseline       | Patched           | Δ                                            |
| ----------------------- | -------------- | ----------------- | -------------------------------------------- |
| `SELECT 1+1`            | 4 345 ops/s    | 5 467             | +26%                                         |
| 1-row query / execute   | 4 047 / 3 652  | 4 412 / 4 554     | +9% / +25%                                   |
| 100×10 query / execute  | 2 178 / 2 126  | 2 755 / 2 795     | +26% / +31%                                  |
| 100×100 query / execute | 843 / 600      | 1 026 / **1 087** | +22% / **+81%**                              |
| 10k query / execute     | 253 / 273      | 262 / 347         | +4% / +27%                                   |
| 100k dates (default)    | 9.6            | 12.7              | +32%                                         |
| insert loop             | ~765 (16% CPU) | ~750 (9% CPU)     | latency fsync-bound; **client CPU ≈ halved** |

MySQL 9 results track 8.3 closely on the client side (9 shows faster inserts server-side in these containers). 1M-row e2e runs are dominated by server+VM variance on shared hardware; the replay numbers above are the trustworthy client-side signal.

## 4. Negative results — what does _not_ help on modern V8

These are worth recording so old optimization folklore doesn't creep back in:

- **Manual JS UTF-8 decoding of short strings** (fromCharCode loops, the classic pre-2018 trick): `buffer.toString('utf8')`/`utf8Slice` now win at every length tested (12-char: 48ns native vs 50–65ns manual). The historical "string creation is expensive, bypass it" note in `packet.js` no longer holds for decoding; it _still_ holds for number parsing (digit loops beat `Number(string)`).
- **Row objects as literals vs assignment chain**: generating `{a: v0, b: v1, …}` is not faster than `const r = {}; r.a = …` — V8's transition-chain and escape-analysis handling makes the current generated code optimal. No change needed in the row-parser codegen shape.
- **`Object.create(config)` as the per-query options object** (to avoid the ~60-key `Object.assign` copy in `Query.start`): a large config object as a prototype makes every downstream options read hit a slow-mode proto — measured **2× regression** on small queries. Keep the copy.
- **`readUInt16LE`/`readUInt32LE` vs manual byte math**: identical (~5ns); Node's typed fast paths are fine.
- **Chunk-size sensitivity is low**: replaying the same 31MB stream as one buffer vs 64KB vs 16KB vs 4KB chunks spans only ~10% — the packet parser's incremental state machine is not a bottleneck.
- **`rowsAsArray` for large scans**: only ~4% faster — row-object allocation is not the limiter; strings and GC are.

## 5. Remaining opportunities (ranked)

Post-patch profiles of the 1M-row scan: GC 30%, `Query.row`+`Command.execute` dispatch ~21%, `utf8Slice` 17%, text-float parse 9%. Dates scan: `new Date(y,m,d,…)` constructor (local-timezone) is now ~73% — i.e. the irreducible core.

1. **Per-row dispatch batching (~5–10% on scans, medium effort).** Every row packet still walks `handlePacket` → sequence check → `Command.execute` → `isError` → state-function call. While a command is in the `row` state the connection could hand the parser a direct per-packet sink and loop packets without the generic dispatch. Needs care around state transitions (EOF, multi-resultset, pause), but the state machine already models this.
2. **GC pressure on large results (the top remaining cost, hard).** The garbage is now mostly unavoidable _product_ (row objects + value strings) plus per-chunk socket Buffers. Options: (a) document/steer users to `.stream()` for big scans (memory already bounded there); (b) `onread`-style static-buffer reads to stop per-chunk allocations — invasive: packets/blob values/column defs alias the chunk, so retained data must be copied, and TLS sockets don't support `onread`; (c) copy small BLOB values out of the chunk on read — this is also a **memory-retention bug fix**: today a 10-byte `Buffer` value pins its entire 64KB network chunk.
3. **Local-timezone `Date` construction** for DATE/DATETIME (~150ns/value floor). Cannot be beaten while producing `Date` objects in local time via the constructor. Practical levers: document `dateStrings: true` (2.9× on date-heavy scans) and `timezone: 'Z'` (hits the 35ns `Date.UTC` path) — or a future opt-in returning the ~7× faster UTC-derived dates. A DST-aware memoized offset cache could get local mode near `Date.UTC` speed but is correctness-sensitive; only worth it with exhaustive DST-transition tests.
4. **First-execute latency: pipeline `PREPARE` + `EXECUTE`.** An uncached `execute()` costs two full round trips because the Execute command waits for Prepare's response. The client could speculatively send both in one flush (MariaDB/other drivers do this) and recover on prepare error. Pure latency win (one RTT per new statement per connection), no CPU change.
5. **Text-protocol DOUBLE parse** (9% of the 3-col scan): the manual digit loop already avoids string allocation; the remainder is arithmetic. Marginal headroom at best.
6. **WASM / alternative parsers: not recommended.** The profiles show the cost centers are V8-object _materialization_ — strings, `Date`s, row objects, and GC — which a WASM parser cannot avoid: every value still crosses the boundary into a JS string/object, and WASM→JS string creation is at best the same cost as `utf8Slice`. The protocol arithmetic that WASM could accelerate (length-coded ints, header walking) is already only a few percent. The existing `generate-function` row-parser compilation _is_ the right "JIT parser" design; the wins in this analysis came from removing per-query/per-value allocations around it, not from parsing speed.

## 6. Documentation-level recommendations

Cheap, user-visible wins worth surfacing in the docs:

- `dateStrings: true` when `Date` objects aren't needed: ~3× on date-heavy results.
- `timezone: 'Z'` when the app treats times as UTC: large date-parse win (now on the `Date.UTC` fast path).
- `trace: false` in production hot paths: ~10% less client CPU per promise-API query (now honored by the promise wrapper).
- `.stream()` for 100k+-row results: bounds memory and avoids major-GC stalls from megabyte row arrays.

## 7. Follow-up: outgoing packet serialization (branch `packet-buffer-allocation`, Aug 2026)

Write-path counterpart to the receive-path work above. Benchmarked with `serialize.js`, a synchronous `toPacket()` loop with no socket; run it interleaved against a baseline checkout and compare best-of-N, since run-to-run variance on a shared machine exceeds small deltas.

**Baseline.** `Execute.toPacket()` serialized every `COM_STMT_EXECUTE` twice: a dry run against `Packet.MockBuffer()` to learn the length, then the real pass. Both passes called `toParameter` per parameter, and both `lengthCodedStringLength` and `writeLengthCodedString` encode the string, so one string parameter was UTF-8-encoded **four times** per execute. `Query.toPacket()` had the same shape on its attribute path (the no-attribute fast path was already single-pass, see §3.1).

**Change.** Every parameter encoder already returns the exact wire length of its value, so the dry run is redundant: `toPacket` now encodes each parameter once, sums the exact packet length arithmetically, allocates once, and writes once. String-shaped values are encoded to bytes inside `toParameter`/`lengthCodedEncoder` and written with `writeLengthCodedBuffer`, so each string is encoded exactly once. `timeEncoder` previously declared `length: 13` while `writeTime` emits 1, 9, or 13 bytes; it now computes the exact length (`Packet.timeLength`, kept next to `writeTime`). Because a length/writer drift would otherwise send uninitialized `allocUnsafe` bytes to the server, both serializers end with an `offset === length` guard that throws instead of returning a short-filled packet, and a unit test pins `parameter.length` to the bytes each writer actually emits across the full type matrix. Byte-for-byte equivalence with the old serializer was verified over randomized packets (legacy, typed and hinted parameters, three charsets including an iconv one, both flag modes, attributes with multibyte names).

Two pre-existing `COM_QUERY` attribute-path bugs fell out of the rewrite: a typed NULL attribute (e.g. `TypedParameter.INT(null)`) kept its declared type so the null bitmap was never set and the packet was malformed, and the unsigned flag of typed attributes was hardcoded to 0. Both now match the `COM_STMT_EXECUTE` path, with regression tests.

### Measured results (`serialize.js`, interleaved best-of-3, M1 Pro)

| Scenario                        | Baseline ops/s | Single-pass | Δ         |
| ------------------------------- | -------------- | ----------- | --------- |
| execute, 3 params (num/str/dbl) | 222k           | 1 454k      | **6.6×**  |
| execute, same, no attr flag     | 328k           | 1 399k      | **4.3×**  |
| execute, 10 short strings       | 46k            | 245k        | **5.3×**  |
| execute, 3 dates                | 191k           | 750k        | **3.9×**  |
| execute, typed mixed            | 174k           | 559k        | **3.2×**  |
| execute, 3 params + attribute   | 163k           | 727k        | **4.5×**  |
| execute, no params              | 1 950k         | 5 329k      | **2.7×**  |
| execute, 16KB blob              | 166k           | 226k        | 1.4×      |
| query, 2 attributes             | 211k           | 629k        | **3.0×**  |
| query, no attributes (§3.1)     | 3 393k         | 3 687k      | unchanged |

E2E deltas are not reportable: on this shared Docker setup the execute scenarios sit at 2–14% client CPU and swing ±50% between runs; the full test suite passes against MySQL 5.7/8.3/9 and MariaDB LTS.

### Buffer pooling and size heuristics: measured, not adopted

The classic alternatives — a pool of pre-allocated send buffers, or serializing into a growable scratch buffer sized by heuristic — were measured (`serialize.js --alloc`) and rejected for this path:

- `Buffer.allocUnsafe` costs 76ns at 32B, 129ns at 256B, 286ns at 1KB (Node's internal 8KB slab already pools small allocations); a pooled-slab view (`subarray`) costs ~70ns flat. For the typical sub-1KB command packet a pool's _best case_ saves a few percent of the packet's build cost — before paying its real costs.
- The real costs are structural: `stream.write()` retains the buffer until flushed, so pooled buffers could only be recycled from the write callback, and TLS, the compressed protocol (async zlib holds the input), and >16MB packet slicing all alias the buffer with their own lifetimes. A bug in that tracking sends another packet's bytes — a cross-connection data leak, not just corruption.
- Real `malloc` only starts at ≥4KB (1.4µs at 4KB, 3µs at 16KB), but such packets are dominated by their payload memcpy and the server round trip; the 16KB-blob row above moved only 1.4× for this reason.
- A size _heuristic_ is unnecessary: every parameter encoder knows its exact wire length, so exact computation replaces guessing, growth, and copy-out (a 64KB copy-out costs 12µs — worse than the allocation it would avoid).

The receive path already avoids per-packet allocation (§3.8): complete packets are views over the socket chunk delivered through one reused `Packet`; only a packet spanning chunk boundaries allocates (~one per 64KB chunk), and pooling those buffers is off the table because BLOB values and column definitions alias them for arbitrarily long (§5.2c).

## 8. Repro

```sh
docker run -d --name mysql83-bench -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -e MYSQL_DATABASE=test -p 3308:3306 mysql:8.3
MYSQL_PORT=3308 node benchmarks/perf/setup.js       # create + populate tables
MYSQL_PORT=3308 node benchmarks/perf/capture.js     # record wire fixtures
./benchmarks/perf/run-all.sh all 3308               # full matrix
node --cpu-prof --cpu-prof-dir=profiles benchmarks/perf/replay.js select-1m-3cols captured
node benchmarks/perf/profile-summary.js profiles/<file>.cpuprofile
node benchmarks/perf/serialize.js                   # outgoing toPacket() scenarios
node benchmarks/perf/serialize.js --alloc           # allocation-strategy micro
```
