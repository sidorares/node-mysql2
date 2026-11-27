# mysql2 vs Bun.SQL, on Node and Bun: results

_27 November 2026 · Apple M5 Pro host, colima Linux VM (6.8 kernel, 12 vCPUs) · MySQL 8.3.0 on 4 pinned vCPUs · client on 2 pinned vCPUs · Node 24.22.3 · Bun 1.4.5 · mysql2 3.24.6 (`master` @ 9f99d418f)_

Methodology and how to rerun: [README.md](README.md). 630 runs (5 driver/runtime combinations × 42 scenario/load cells × 3 shuffled repetitions, 2 s warmup + 4 s measured, a fresh process per run), 0 failures, no server restarts. Cells are medians of the 3 repetitions.

## Measurement quality

- **Server never limited mysql2.** MySQL had 400% available; in every mysql2 cell it stayed between 50% and 290%, so mysql2's numbers are client-bound. Bun.SQL reached 316% on `pk` at 64 callers and 399% at 1024, so its high-concurrency numbers are a lower bound.
- **Client cores were ~90% ours.** Other work in the VM took a median of 9.9% of one core on the client's two vCPUs (max 20%).
- **Run-to-run spread** (max − min over median, 3 repetitions): median 11%, p90 22%. Differences under ~20% in a single cell are noise; the findings below are multiples.
- **CPU accounting verified.** `process.cpuUsage()` matched the client container's cgroup counters to the percent on both runtimes, so Bun's numbers are not missing native threads.

## Headline

| 64 callers, pool 16              | mysql2 query, Node | mysql2 execute, Node | mysql2 execute, Bun | Bun.SQL  |
| -------------------------------- | ------------------ | -------------------- | ------------------- | -------- |
| PK read, ops/s                   | 63k                | 65k                  | 84k                 | **300k** |
| PK read, client CPU µs/query     | 18.2               | 15.5                 | 12.1                | **3.3**  |
| PK read, p99 ms                  | 4.2                | 2.2                  | 1.7                 | **0.7**  |
| Web handler (PK + list), req/s   | 22k                | 24k                  | 33k                 | **83k**  |
| 100 wide rows, ops/s             | 1.9k               | 2.2k                 | 4.1k                | **7.6k** |
| Transaction (5 statements), tx/s | 17k                | 16k                  | 17k                 | **27k**  |
| Single-row insert, ops/s         | 71k                | 69k                  | 77k                 | 86k      |

1. **Bun.SQL uses 3.5–5× less client CPU per query than mysql2** on small queries, and up to 4.6× the throughput from one process. On 1-row reads the gap is widest; it narrows as rows get bigger (1.9× on 100 wide rows, 1.5× on 10k-row scans) and on server-bound work (inserts, transactions).
2. **mysql2 runs 1.3–1.9× faster on Bun than on Node**, from the same JavaScript: 84k vs 65k PK reads/s, 4.1k vs 2.2k wide pages/s, 33k vs 24k web requests/s. Part of it is Node's socket write path, part is JIT and string handling (see §Bottlenecks 3 and 7).
3. **Sequential latency barely differs.** One caller on one connection: PK read p50 is 44 µs for Bun.SQL and 47–55 µs for mysql2 in every combination; server + loopback dominate. On a real network the RTT swamps this. **The gap is a capacity gap**: how much traffic one process carries before its p99 collapses.
4. **Open loop (Poisson arrivals, PK reads):** at 20k req/s every driver keeps p99 ≤ 5 ms. At 60k req/s mysql2 on Node is at 90–95% of a core with p99 16–26 ms; mysql2 on Bun at 69% with p99 3–5 ms; Bun.SQL at 34% with p99 2.4 ms.
5. **Fairness is fine everywhere.** At 4–1024 concurrent callers, per-caller completed queries vary by CV ≤ 0.05 (mysql2) and ≤ 0.03 (Bun.SQL). No driver starves callers. mysql2's throughput plateaus at ~16 callers (it is CPU-bound at one core); `query()` on Node degrades from 72k to 49k at 1024 callers.
6. **A heavy query starves the event loop's neighbours in proportion to its CPU cost.** With one caller running 10k-row scans next to 32 PK readers, PK throughput on Node mysql2 falls from ~65k to 11–15k (the scan loop alone needs ~110% of a core: 161 scans/s × 6.7 ms), p50 rises to 1.4–3.5 ms. mysql2 on Bun keeps 32–38k, Bun.SQL 69k.

### Large values, bulk, connections

| Client CPU per op, 1 caller | mysql2 query, Node | mysql2 execute, Node | mysql2 execute, Bun | Bun.SQL |
| --------------------------- | ------------------ | -------------------- | ------------------- | ------- |
| Read 1 MiB text             | 1.60 ms            | 1.70 ms              | 0.92 ms             | 0.69 ms |
| Read 1 MiB blob             | 0.42 ms            | 0.32 ms              | 0.38 ms             | 0.21 ms |
| Insert 1 MiB string         | 1.34 ms            | 1.36 ms              | 0.95 ms             | 1.01 ms |
| Insert 1 MiB Buffer         | **3.35 ms**        | 0.46 ms              | 0.42 ms             | 0.30 ms |
| Bulk insert 1000 × 5        | 0.59 ms            | **0.76 ms**          | 0.53 ms             | 0.18 ms |
| Scan 10k rows               | 7.06 ms            | 4.43 ms              | 3.21 ms             | 2.69 ms |
| Connect + `SELECT 1` + quit | **402 µs**         | 452 µs               | 188 µs              | 111 µs  |

Peak RSS under these workloads: Node 150–370 MB, mysql2 on Bun 90–200 MB, Bun.SQL 65–120 MB. Max event-loop stall while scanning 10k rows with 8 concurrent callers: 42–46 ms on Node, 7–13 ms on Bun.

## Where mysql2's time goes

Kernel vs user time per PK read (64 callers, pool 16):

| µs per query   | user | kernel | total |
| -------------- | ---- | ------ | ----- |
| mysql2 on Node | 9.5  | 6.0    | 15.5  |
| mysql2 on Bun  | 6.4  | 5.7    | 12.1  |
| Bun.SQL        | 1.8  | 1.5    | 3.3   |

With a single caller (no batching possible) every driver pays ~8 µs of kernel time per query. Under concurrency Bun.SQL's kernel cost falls 5× and mysql2's does not: **Bun.SQL pipelines**. 64 concurrent queries on **one** connection: Bun.SQL 94k/s (one server thread saturated at 100%), mysql2 17–19k/s, exactly its single-caller rate. Bun.SQL sends queued queries without waiting for the previous result and coalesces them into one `write()`; mysql2 sends one command per connection at a time, one syscall each. On loopback a `write()` also runs the receiver's TCP path, so in the Node profile `writeBuffer` is 42% of all client CPU.

## Bottlenecks, ranked by impact

Each item names the evidence; profiles are reproducible with `node run.mjs --profile profiles …` and `node profile-summary.mjs`.

**1. No pipelining or write coalescing (largest; prototyped, see Round 2).** Accounts for most of the 4–5× gap at concurrency: ~4.5 µs of extra kernel time per query and one `write()` per command. The spike in [#4707](https://github.com/sidorares/node-mysql2/pull/4707) takes one connection from 19k to 118k PK reads/s, p99 8.6 → 0.9 ms, 23.5 → 8.5 µs client CPU per query, on par with Bun.SQL. Remaining work: pool dispatch onto busy connections, tests, docs.

**2. Default `trace: true` stack capture (≈12% of small-query CPU; low effort).** `captureStackHolder` captures an `Error` stack on every promise-API call. `trace: false` on Node: PK reads 74k → 85k/s (+15%), 14 → 12 µs/query. Options: capture with a small `Error.stackTraceLimit`, or default it off for production (`NODE_ENV`), or document it prominently.

**3. Local-time date materialization (up to 50% of row-decode CPU; medium effort).** 100 rows with 5 date columns: 382 µs/query on Node by default, **186 µs with `timezone: 'Z'`** (193 with `dateStrings`). In the profile, `proveHourOffset` (the miss path of the per-hour offset cache in `lib/parsers/local_date.js`) is **35% of all client CPU**: realistic timestamps spread across years land in a new hour almost every time, each miss costs three `localTime` calls (six `Date` constructions), and the 4096-hour cache is cleared wholesale when full. The same loop in isolation (micro-benchmark, same Node, same data shape) does not reproduce the miss cost, so V8 optimization state in the real process plays a part and needs a closer look. Direction: cache per day or per DST-stable interval so one proof covers 24× or more values, make the miss path no costlier than the plain constructor, and add spread-out timestamps to the micro benchmarks. Scans hit it too (`users.created_at`): `localDate` + `localTime` are 18–26% of a 10k-row scan.

**4. Eager 16,000-slot statement cache per connection (≈50% of connect CPU; low effort).** Every new connection calls `createLRU({ max: 16000 })` (`lib/base/connection.js:131`), which fills four 16,000-element arrays: `createLRU` is 31% and GC 22% of the `connect` profile, even for connections that never call `execute()`. Creating the cache on first `prepare`, or an LRU that grows its arrays lazily, would roughly halve Node's 400 µs connect cost (mysql2 on Bun: 172 µs; Bun.SQL: 111 µs). Matters for serverless and connection-per-request code. Measured: `maxPreparedStatements: 16` cuts Node connect CPU from 363 to 119 µs and lifts 8-caller connect throughput from 4.1k to 14.9k/s (Round 2).

**5. `execute()` with many parameters (medium effort).** A 1000-row × 5-column bulk insert through `execute()` costs 0.76 ms, more than `query()` (0.59 ms) and 4× Bun.SQL (0.18 ms). The profile is per-parameter typing and encoding: `Execute.toPacket`, `toParameter`, `integerHint`/`checkedInteger`, byte-by-byte `writeUInt8`. A fast path for plain JS numbers/strings/Dates without typed hints, and direct index writes instead of `Buffer#writeUInt8`, are the candidates.

**6. Buffer parameters through `query()` (low effort, mostly docs).** A 1 MiB Buffer costs 3.35 ms through `query()` vs 0.46 ms through `execute()`: the value becomes a 2 MiB hex literal inside a formatted SQL string, which is then regex-escaped and UTF-8 encoded again (native string building 40%, GC 26%, the escape regex 4%; the hex conversion itself is only 6%). Recommend `execute()` for binary data in the docs; the escaper could skip rescanning hex literals.

**7. Per-query JavaScript around the protocol (medium effort, several small items).** Each pool query does a `process.nextTick` for acquire (4.6% of the PK profile), a `diagnostics_channel` trace wrapper, `acquire`/`release` emits, a `.once('end')` listener and a wrapper closure; the parser and statement caches cost `lru.min#get` 2%. `checkTimezone` reads `process.env.TZ` once per result set (1.3%: an env read in Node is a C++ interceptor call). Individually small, together a large part of the 9.5 µs user time.

**8. Runtime-bound, not mysql2's to fix.** Decoding a 1 MiB UTF-8 text value is 75% `utf8Slice` + GC of the 2 MB two-byte string on Node (1.6 ms) vs 0.7 ms on Bun. mysql2 can only offer alternatives: `typeCast` to keep a Buffer, or streaming.

## Round 2: raw parsing, 100k-row results, pipelining spike, statement cache

Same setup, run afterwards: 75 + 108 + 24 + 32 runs, 0 failures. Medians of 3 repetitions (2 for the `timezone: 'Z'` reruns).

### Raw row decoding with round trips hidden

Many rows per query, enough concurrent queries that the client is never waiting on the network (`parse` suite): client CPU per row.

| ns per row                    | mysql2 query, Node | mysql2 execute, Node | mysql2 execute, Bun | Bun.SQL |
| ----------------------------- | ------------------ | -------------------- | ------------------- | ------- |
| 10k rows × 8 cols, 32 callers | 593                | 614                  | 334                 | 234     |
| 100k rows × 8 cols, 1 caller  | 653                | 718                  | 324                 | 236     |
| 100k rows × 8 cols, 2 callers | 744                | 747                  | 314                 | 219     |
| 100 rows × 40 mixed cols      | 5,803              | 4,921                | 2,460               | 1,279   |
| same, `timezone: 'Z'`         | 4,008              | **2,016**            | 1,521               | –       |
| 8-col scans, `timezone: 'Z'`  | 517–642            | 524–620              | 298–322             | –       |

Throughput on a 100k-row result: 2.0M rows/s (mysql2 on Node), 3.2M (mysql2 on Bun), 4.2M (Bun.SQL); a single 100k-row query holds the event loop for 13–38 ms in every combination.

- On plain 8-column rows mysql2's decoder costs **1.4× Bun.SQL's on Bun, 2.7–3× on Node**. Local dates are only 10–15% of that; with them removed Node is still ~1.8× mysql2-on-Bun for the same JavaScript, so most of the remaining Node gap is the runtime (object and string materialization, GC), not a single mysql2 hotspot.
- On date-heavy rows local-time `Date` construction **is** the hotspot: `timezone: 'Z'` takes Node `execute()` from 4.9 to 2.0 µs/row, within 1.6× of Bun.SQL (§Bottleneck 3).
- `query()` (text protocol) decodes wide rows much slower than `execute()` on Node even with UTC dates (4.0 vs 2.0 µs/row): text DECIMAL/DOUBLE/DATETIME parsing from strings.

### Pipelining spike: one connection, 64 concurrent callers

A prototype of opt-in pipelining is in [#4707](https://github.com/sidorares/node-mysql2/pull/4707) (`pipelining` connection option, `lib/base/connection.js`, `lib/connection_config.js`; see "Spike design" below). Results, mysql2 at depth 64 vs off vs Bun.SQL (which always pipelines):

| 1 connection, 64 callers     | `SELECT 1` ops/s | PK read ops/s | PK p99   | PK client µs/op | 50 rows ops/s | 100 wide rows ops/s |
| ---------------------------- | ---------------- | ------------- | -------- | --------------- | ------------- | ------------------- |
| mysql2 execute, Node, off    | 25k              | 19k           | 8.57 ms  | 23.5            | 10.0k         | 1.9k                |
| mysql2 execute, Node, **on** | **326k**         | **118k**      | **0.88** | **8.5**         | **31.8k**     | 2.3k                |
| mysql2 query, Node, **on**   | 253k             | 89k           | 1.23     | 10.1            | 26.7k         | 2.2k                |
| mysql2 execute, Bun, off     | 27k              | 20k           | 8.49     | 20.8            | 10.4k         | 2.9k                |
| mysql2 execute, Bun, **on**  | 290k             | 106k          | 1.14     | 8.4             | 31.4k         | 4.4k                |
| Bun.SQL                      | 245k             | 102k          | 1.03     | 5.8             | 35.4k         | 5.6k                |

- **Pipelining removes most of the small-query gap.** On one connection mysql2 goes from 19k to 118k PK reads/s and p99 from 8.6 ms to 0.9 ms; client CPU per query drops 2.8× (23.5 → 8.5 µs) because one `write()` and one read now carry many queries. On `SELECT 1` pipelined mysql2 on Node outruns Bun.SQL (326k vs 245k, 3.1 vs 4.0 µs/query).
- PK reads and 50-row lists are now **server-bound** for both drivers: one connection is one MySQL thread, at 99–100% in every pipelined cell. Client CPU per op is the comparison that is left: mysql2 8.4–8.5 µs vs Bun.SQL 5.8 µs on PK reads.
- **Wide rows barely move** (Node 1.9k → 2.3k/s): they are client-decode-bound (above), which pipelining cannot help.
- `query()` pipelines only when its SQL is identical in both escaping modes (numbers, plain identifiers); the PK benchmark's numeric id qualifies, a string with a quote would not.

#### Spike design and safety

- **What is pipelined:** `execute()` once its statement id is known (a cached `PREPARE` resolves synchronously, so repeat executes pipeline immediately; a first-time `PREPARE` is sent and its `EXECUTE` waits for the id), `prepare`, and `query()` whose SQL is the same whether or not the server is in `NO_BACKSLASH_ESCAPES`. Everything else (handshake, `ping`, change user, reset, quit, binlog) is a barrier: it waits for all in-flight commands, and nothing is sent past it until it starts.
- **Why the `query()` rule:** client-side escaping depends on the server's last reported `NO_BACKSLASH_ESCAPES` status. A query written while an earlier `SET sql_mode` is still in flight would be escaped for the wrong mode — an injection risk. The repository's `test-no-backslash-escapes` test caught exactly this in the first version of the spike. Prepared statements bind values server-side and are unaffected.
- **`LOAD DATA LOCAL`:** a pipelined command already in the server's buffer would be read as file contents, so enabling `pipelining` stops advertising `LOCAL_FILES` (the server then refuses `LOCAL INFILE`), and pipelining switches itself off if `LOCAL_FILES` is set explicitly. It is also off with `compress`.
- **Writes are coalesced** by corking the socket until the end of the tick.
- **Timeouts** start when the command becomes current, not when it is written, so a `timeout` still measures the command's own execution and not the time queued behind others.
- **Semantics that change when you opt in:** an error does not stop the commands behind it (MySQL executes each independently — never pipeline a transaction's statements from concurrent callers, which is already unsafe today); `destroy()` with commands in flight lets every command already written complete (up to the depth) instead of 1.
- **Pool:** the pool still hands each connection to one caller at a time, so `pool.query()` does not pipeline yet. Making it dispatch onto busy connections (as Bun.SQL's pool does) is the next step and needs its own design.
- **Verification:** `pipeline-check.mjs` (result ordering, error isolation, prepare/execute, a 10k-row result among small queries, `LOAD DATA LOCAL` refusal, barriers, transactions, `destroy()`) passes on Node and Bun. The full test suite passes unchanged with the option off (265 files). With pipelining **forced on for every connection** (`FORCE_PIPELINING=1 ./docker-test-suite.sh`), 260 pass; the 5 failures are the four `LOAD DATA LOCAL` tests (by design) and `test-connect-sha1`, whose fake server asserts that the client does not send its second query before the first result. `test-pool-disconnect` is flaky on unmodified `HEAD` as well (2 of 6 runs fail there, 1 of 6 with the spike).
- **Not done:** unit/integration tests for the option itself, documentation, pool dispatch, MariaDB's `PREPARE`+`EXECUTE` pipelining (statement id −1).

### Statement cache size and connection setup

There is no switch to disable the per-connection prepared-statement cache, only `maxPreparedStatements` (default 16,000; `0` falls back to the default through `|| 16000`). MySQL's own `max_prepared_stmt_count` is 16,382 **for the whole server**, so the default is larger than any one connection can use. Lowering it removes the eager allocation:

| connect + `SELECT 1` + quit, `query()` | default (16,000)        | `maxPreparedStatements: 16` |
| -------------------------------------- | ----------------------- | --------------------------- |
| Node, 1 caller                         | 3.0k/s, 363 µs CPU      | **4.8k/s, 119 µs CPU**      |
| Node, 8 callers                        | 4.1k/s, 324 µs, 384 MB  | **14.9k/s, 72 µs, 161 MB**  |
| Bun, 8 callers                         | 10.2k/s, 112 µs, 143 MB | 18.6k/s, 55 µs, 90 MB       |

A 3× cut in connect CPU and 3.6× more connections per second on Node. A lazily allocated cache would give this by default without lowering the cap.

## What else is worth measuring

Not covered yet, in rough priority:

- **TLS.** Production connections are usually encrypted; TLS record overhead favors batching (pipelining) even more. Bun.SQL vs mysql2 with `ssl`.
- **Real network RTT** (the "nearby computer" option): shows how much of the capacity gap survives once 200–500 µs of RTT dominates, and makes pipelining's latency benefit (not just CPU) visible.
- **First `execute()` of a statement** (cache miss: two round trips) and **statement-cache churn** with many distinct queries.
- **`.stream()` for large results** vs buffering: memory ceiling and event-loop stalls on 100k+ rows.
- **Compression** (`compress: true`), and MariaDB as a server.

## Caveats

- Same-machine loopback: syscall costs include the receiver's TCP processing, which inflates the pipelining effect relative to a NIC, though per-syscall cost on real networks is similar or higher.
- Value types are close but not identical: both return DECIMAL as string, JSON parsed, DATETIME as `Date`, binary as Buffer; Bun.SQL returns BIGINT as a string, mysql2 (default `supportBigNumbers: false`) as a number.
- The colima VM was shared with ~60 unrelated containers and had under 1 GB of free memory; MySQL was sized down (128 MB buffer pool, `MALLOC_ARENA_MAX=2`) after two VM-level OOM kills in earlier attempts. The final matrix had no restarts.

## Appendix: full tables

Generated with `node report.mjs results/full.jsonl`.

#### Throughput, ops/s, 64 VUs, pool 16

|         | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| wide100 |             1,910 |               2,163 |            3,677 |              4,077 |       7,584 |
| web     |            22,128 |              23,804 |           31,542 |             33,355 |      83,271 |
| update  |            81,553 |              72,368 |          108,417 |             96,923 |     137,499 |
| select1 |            75,013 |              83,590 |          106,542 |            106,678 |     336,029 |
| insert  |            71,055 |              69,300 |           81,609 |             76,989 |      86,034 |
| tx      |            17,143 |              16,147 |           18,907 |             16,987 |      26,532 |
| pk      |            63,485 |              65,461 |           86,003 |             84,427 |     299,912 |
| list50  |            25,055 |              22,309 |           30,847 |             35,420 |      67,519 |

#### Client CPU per op (µs), 64 VUs, pool 16

Lower is better. Pure client cost, independent of server speed.

|         | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| wide100 |             649.4 |               587.7 |            303.5 |              280.1 |       152.2 |
| web     |              54.9 |                42.7 |             32.5 |               30.6 |        12.1 |
| update  |              12.7 |                13.7 |              8.8 |               10.4 |         4.8 |
| select1 |              14.7 |                12.0 |              9.6 |                9.5 |         3.0 |
| insert  |              14.7 |                12.6 |              9.6 |               10.0 |         5.9 |
| tx      |              58.5 |                62.0 |             53.2 |               59.6 |        37.4 |
| pk      |              18.2 |                15.5 |             11.8 |               12.1 |         3.3 |
| list50  |              52.3 |                46.0 |             33.3 |               29.2 |        15.4 |

#### p99 latency (ms), 64 VUs, pool 16

|         | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| wide100 |             49.41 |               43.86 |            28.00 |              25.96 |       17.66 |
| web     |              8.78 |                5.91 |             4.63 |               3.90 |        2.57 |
| update  |              2.38 |                2.51 |             1.49 |               1.73 |        5.26 |
| select1 |              3.16 |                1.87 |             1.24 |               1.30 |        0.55 |
| insert  |              3.26 |                3.74 |             3.44 |               3.15 |        4.98 |
| tx      |              7.75 |                8.32 |             7.20 |               7.65 |        6.08 |
| pk      |              4.21 |                2.21 |             1.56 |               1.68 |        0.71 |
| list50  |              7.32 |                7.69 |             4.96 |               4.03 |        2.73 |

#### Server CPU, % of one core, 64 VUs

MySQL has 4 dedicated vCPUs (400%).

|         | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| wide100 |                74 |                  49 |              127 |                 86 |         148 |
| web     |               166 |                 159 |              215 |                193 |         313 |
| update  |               252 |                 230 |              292 |                275 |         259 |
| select1 |               114 |                 107 |              150 |                134 |         185 |
| insert  |               271 |                 225 |              285 |                287 |         291 |
| tx      |               213 |                 186 |              231 |                206 |         257 |
| pk      |               156 |                 141 |              207 |                180 |         316 |
| list50  |               142 |                 144 |              211 |                200 |         227 |

#### Latency p50 (ms), sequential (1 VU, 1 connection)

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| insert        |             0.054 |               0.054 |            0.050 |              0.051 |       0.047 |
| wide100       |             0.528 |               0.449 |            0.417 |              0.312 |       0.242 |
| text1m-read   |             1.102 |               1.135 |            0.873 |              0.750 |       0.684 |
| pk            |             0.055 |               0.050 |            0.051 |              0.047 |       0.044 |
| update        |             0.066 |               0.061 |            0.061 |              0.057 |       0.052 |
| connect       |             0.267 |               0.320 |            0.194 |              0.220 |       0.246 |
| select1       |             0.041 |               0.041 |            0.038 |              0.037 |       0.035 |
| text1m-insert |             4.864 |               4.171 |            5.387 |              4.315 |       4.576 |
| web           |             0.145 |               0.134 |            0.141 |              0.129 |       0.111 |
| tx            |             0.261 |               0.251 |            0.253 |              0.243 |       0.227 |
| scan10k       |             4.880 |               3.660 |            4.348 |              3.476 |       2.923 |
| blob1m-insert |             7.612 |               8.205 |            7.226 |              8.318 |       8.343 |
| bulk1000      |             1.604 |               1.409 |            1.463 |              1.125 |       0.807 |
| list50        |             0.108 |               0.103 |            0.095 |              0.092 |       0.077 |
| blob1m-read   |             0.282 |               0.237 |            0.244 |              0.252 |       0.202 |

#### Latency p99 (ms), sequential

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| insert        |             0.192 |               0.225 |            0.170 |              0.273 |       0.197 |
| wide100       |             3.173 |               1.335 |            1.543 |              1.308 |       0.653 |
| text1m-read   |             3.071 |               3.179 |            2.886 |              2.565 |       1.740 |
| pk            |             0.199 |               0.202 |            0.201 |              0.163 |       0.140 |
| update        |             0.244 |               0.226 |            0.227 |              0.197 |       0.172 |
| connect       |             1.654 |               1.778 |            1.682 |              1.859 |       0.840 |
| select1       |             0.134 |               0.120 |            0.120 |              0.149 |       0.114 |
| text1m-insert |             7.206 |               6.934 |            7.589 |              6.443 |       6.841 |
| web           |             0.550 |               0.476 |            0.539 |              0.521 |       0.400 |
| tx            |             0.992 |               0.851 |            1.033 |              0.943 |       0.755 |
| scan10k       |            12.199 |               7.671 |            7.551 |              6.189 |       5.417 |
| blob1m-insert |             9.782 |              10.487 |           10.151 |             10.914 |      10.353 |
| bulk1000      |             3.305 |               3.608 |            3.281 |              2.964 |       1.816 |
| list50        |             0.410 |               0.451 |            0.305 |              0.424 |       0.273 |
| blob1m-read   |             1.128 |               0.923 |            1.598 |              2.057 |       1.201 |

#### Client CPU per op (µs), sequential

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| insert        |              22.3 |                23.7 |             18.9 |               21.7 |        16.8 |
| wide100       |             667.1 |               431.1 |            333.3 |              290.5 |       155.5 |
| text1m-read   |            1604.9 |              1701.3 |           1046.3 |              915.9 |       692.0 |
| pk            |              24.8 |                24.7 |             22.5 |               21.5 |        15.8 |
| update        |              27.2 |                27.2 |             23.1 |               22.8 |        17.5 |
| connect       |             402.4 |               452.0 |            172.3 |              188.2 |       110.5 |
| select1       |              20.1 |                20.1 |             17.2 |               18.3 |        14.2 |
| text1m-insert |            1341.0 |              1364.6 |           1174.5 |              953.8 |      1007.2 |
| web           |              66.5 |                66.5 |             59.9 |               58.7 |        41.2 |
| tx            |             111.6 |               109.0 |            106.0 |              110.0 |        84.2 |
| scan10k       |            7059.3 |              4425.7 |           3916.0 |             3214.8 |      2687.6 |
| blob1m-insert |            3345.2 |               459.7 |           1256.3 |              419.0 |       295.1 |
| bulk1000      |             591.3 |               756.4 |            434.9 |              534.9 |       175.7 |
| list50        |              68.2 |                54.0 |             39.6 |               43.0 |        29.3 |
| blob1m-read   |             424.6 |               319.9 |            323.8 |              383.3 |       210.0 |

#### Throughput, ops/s, sequential

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| insert        |            16,549 |              15,450 |           17,509 |             14,280 |      18,110 |
| wide100       |             1,495 |               2,015 |            2,111 |              2,698 |       3,738 |
| text1m-read   |               798 |                 764 |              921 |              1,066 |       1,292 |
| pk            |            15,834 |              17,261 |           16,848 |             18,656 |      20,398 |
| update        |            13,321 |              14,357 |           14,385 |             15,718 |      17,204 |
| connect       |             2,701 |               2,356 |            3,932 |              3,512 |       3,595 |
| select1       |            21,366 |              22,360 |           23,335 |             22,881 |      25,449 |
| text1m-insert |               199 |                 229 |              179 |                225 |         212 |
| web           |             5,897 |               6,385 |            6,131 |              6,673 |       7,770 |
| tx            |             3,487 |               3,637 |            3,483 |              3,495 |       3,929 |
| scan10k       |               174 |                 247 |              215 |                269 |         316 |
| blob1m-insert |               128 |                 119 |              134 |                115 |         118 |
| bulk1000      |               581 |                 652 |              618 |                784 |       1,165 |
| list50        |             7,719 |               8,130 |            9,390 |              9,336 |      11,548 |
| blob1m-read   |             2,847 |               3,285 |            2,601 |              2,252 |       3,467 |

#### Throughput, ops/s, 8 VUs, pool 8

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| blob1m-read   |            4589.5 |              3776.9 |           3460.7 |             4039.3 |      4566.3 |
| bulk1000      |            2308.5 |              1259.9 |           3076.3 |             2139.7 |      3406.8 |
| connect       |            3791.6 |              3895.2 |           9519.5 |             8106.2 |     14483.4 |
| text1m-read   |             924.1 |               893.3 |           1279.9 |             1094.7 |      1296.7 |
| blob1m-insert |             546.0 |               442.7 |            578.6 |              458.2 |       457.9 |
| scan10k       |             189.1 |               173.6 |            259.4 |              264.9 |       465.2 |
| text1m-insert |             831.9 |               951.0 |            818.3 |              979.0 |      1009.1 |

#### Client CPU per op (µs), 8 VUs, pool 8

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| blob1m-read   |               297 |                 360 |              360 |                311 |         257 |
| bulk1000      |               476 |                 800 |              336 |                489 |         208 |
| connect       |               356 |                 350 |              121 |                142 |          68 |
| text1m-read   |             1,254 |               1,294 |              875 |              1,022 |         836 |
| blob1m-insert |             2,123 |                 924 |              870 |                246 |         201 |
| scan10k       |             6,747 |               7,377 |            4,039 |              3,774 |       2,495 |
| text1m-insert |             1,046 |                 864 |            1,000 |                843 |         824 |

#### p99 latency (ms), 8 VUs, pool 8

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| blob1m-read   |              4.97 |                6.07 |             5.97 |               5.16 |        4.47 |
| bulk1000      |              7.29 |               12.68 |             5.67 |               7.12 |        5.60 |
| connect       |              6.28 |                6.10 |             3.29 |               3.63 |        3.32 |
| text1m-read   |             18.14 |               20.38 |            13.30 |              15.85 |       13.33 |
| blob1m-insert |             26.59 |               29.49 |            24.29 |              28.25 |       26.80 |
| scan10k       |             85.81 |               93.09 |            49.90 |              44.18 |       34.46 |
| text1m-insert |             16.30 |               16.47 |            16.40 |              14.81 |       15.46 |

#### Event-loop lag max (ms), 8 VUs, pool 8

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| blob1m-read   |               6.0 |                 6.8 |              4.3 |                6.4 |         3.8 |
| bulk1000      |               5.2 |                 7.0 |              6.4 |                4.0 |         4.2 |
| connect       |               6.6 |                 4.7 |              5.0 |                3.7 |         2.8 |
| text1m-read   |               9.7 |                15.3 |              9.6 |               10.2 |        10.8 |
| blob1m-insert |               9.7 |                 4.1 |              6.4 |                3.6 |         3.1 |
| scan10k       |              42.3 |                46.0 |             10.1 |                7.3 |        13.4 |
| text1m-insert |               6.1 |                 5.8 |              6.6 |                5.7 |         6.9 |

#### Peak RSS (MB), 8 VUs, pool 8

|               | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| blob1m-read   |               257 |                 269 |              121 |                120 |          95 |
| bulk1000      |               168 |                 153 |              106 |                131 |          75 |
| connect       |               373 |                 325 |              148 |                139 |          84 |
| text1m-read   |               251 |                 268 |              138 |                144 |          98 |
| blob1m-insert |               240 |                 137 |              164 |                 89 |          65 |
| scan10k       |               260 |                 255 |              202 |                199 |         122 |
| text1m-insert |               150 |                 143 |              109 |                100 |          71 |

#### Concurrency sweep (pk, pool ≤ 16): ops/s

|          | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| -------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| 1 VUs    |            15,720 |              17,221 |           17,350 |             17,846 |      21,362 |
| 4 VUs    |            59,919 |              63,655 |           59,219 |             72,942 |      81,046 |
| 16 VUs   |            71,671 |              66,559 |           83,982 |             83,989 |     131,410 |
| 64 VUs   |            61,193 |              67,483 |           92,770 |             80,209 |     281,859 |
| 256 VUs  |            63,885 |              61,732 |           82,520 |             82,738 |     400,434 |
| 1024 VUs |            49,048 |              59,341 |           84,725 |             81,332 |     500,865 |

#### Concurrency sweep: p99 ms

|          | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| -------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| 1 VUs    |              0.20 |                0.17 |             0.19 |               0.18 |        0.12 |
| 4 VUs    |              0.24 |                0.24 |             0.24 |               0.21 |        0.15 |
| 16 VUs   |              0.77 |                0.69 |             0.65 |               0.60 |        0.39 |
| 64 VUs   |              4.32 |                2.19 |             1.39 |               1.93 |        0.75 |
| 256 VUs  |              8.83 |                8.40 |             5.85 |               6.08 |        4.08 |
| 1024 VUs |             45.85 |               30.04 |            18.77 |              20.41 |       13.51 |

#### Concurrency sweep: fairness (CV of per-VU op counts)

Lower is fairer: 0 means every VU completed the same number of queries.

|          | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| -------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| 1 VUs    |                 – |                   – |                – |                  – |           – |
| 4 VUs    |             0.001 |               0.001 |            0.001 |              0.001 |       0.001 |
| 16 VUs   |             0.034 |               0.051 |            0.015 |              0.024 |       0.012 |
| 64 VUs   |             0.001 |               0.001 |            0.001 |              0.001 |       0.011 |
| 256 VUs  |             0.001 |               0.001 |            0.001 |              0.001 |       0.015 |
| 1024 VUs |             0.003 |               0.002 |            0.001 |              0.001 |       0.031 |

#### Open loop (pk, pool 16): p50 ms

Poisson arrivals, latency from the scheduled arrival time (includes queueing, no coordinated omission).

|          | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| -------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| 5,000/s  |              1.05 |                1.08 |             0.89 |               0.88 |        0.84 |
| 20,000/s |              1.36 |                1.41 |             1.01 |               0.99 |        0.96 |
| 40,000/s |              1.71 |                1.68 |             1.14 |               1.11 |        1.03 |
| 60,000/s |              2.13 |                2.27 |             1.21 |               1.19 |        1.00 |

#### Open loop: p99 ms

|          | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| -------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| 5,000/s  |              3.50 |                3.35 |             2.42 |               2.97 |        3.17 |
| 20,000/s |              5.00 |                3.97 |             2.79 |               2.18 |        2.60 |
| 40,000/s |             11.90 |                3.79 |             7.84 |               2.32 |        4.47 |
| 60,000/s |             16.15 |               25.89 |             5.30 |               3.26 |        2.44 |

#### Open loop: p99.9 ms

|          | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| -------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| 5,000/s  |             10.54 |                9.06 |             4.36 |               7.17 |        9.52 |
| 20,000/s |             10.93 |                6.05 |             6.64 |               4.30 |        5.12 |
| 40,000/s |             19.65 |                5.38 |            16.16 |               5.20 |        7.88 |
| 60,000/s |             21.19 |               28.19 |             7.26 |               7.08 |        4.91 |

#### Open loop: client CPU %

|          | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| -------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| 5,000/s  |                23 |                  24 |               20 |                 21 |          12 |
| 20,000/s |                42 |                  44 |               35 |                 34 |          28 |
| 40,000/s |                70 |                  63 |               53 |                 53 |          33 |
| 60,000/s |                95 |                  90 |               68 |                 69 |          34 |

#### Noisy neighbour: 32 VUs of pk + 1 VU of 10k-row scans, pool 16

|                 | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| --------------- | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| pk ops/s        |            15,126 |              11,527 |           38,069 |             31,750 |      69,152 |
| pk p50 ms       |              1.41 |                3.47 |             0.68 |               0.84 |        0.32 |
| pk p99 ms       |              8.38 |                7.38 |             3.41 |               3.85 |        2.87 |
| pk max ms       |              21.5 |                18.1 |             10.6 |               10.9 |        11.5 |
| 10k scans/s     |             161.0 |               216.0 |            184.0 |              199.2 |       295.2 |
| loop lag p99 ms |               7.1 |                 4.9 |              2.2 |                1.9 |         1.6 |
| loop lag max ms |               9.2 |                 7.8 |              2.8 |                2.6 |         4.2 |

#### Single connection, 64 concurrent pk queries (pipelining check)

|              | node/mysql2-query | node/mysql2-execute | bun/mysql2-query | bun/mysql2-execute | bun/bun-sql |
| ------------ | ----------------: | ------------------: | ---------------: | -----------------: | ----------: |
| ops/s        |            17,006 |              17,614 |           17,130 |             18,976 |      94,046 |
| p99 ms       |             10.17 |                9.44 |            10.28 |               9.61 |        1.55 |
| server CPU % |                49 |                  43 |               50 |                 47 |         100 |

#### Measurement quality

- Foreign load on client vCPUs: median 9.9%, max 20.5% of one core.
- Run-to-run throughput spread (max−min)/median: median 11.0%, p90 22.0%.
- Highest server CPU in any cell: 399% of 400%.
