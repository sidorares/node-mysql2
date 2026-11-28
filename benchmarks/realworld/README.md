# Real-world benchmarks: mysql2 on Node and Bun vs Bun.SQL

Application-shaped workloads (CRUD, transactions, report pages, exports, large values, bulk inserts, connection churn, mixed traffic) measured with pools and concurrency, reporting what an app owner cares about: throughput, p50/p95/p99/p99.9 latency, client CPU per query, event-loop lag, memory, fairness between concurrent callers.

Findings from the first full run are in [RESULTS.md](RESULTS.md). The isolated client-internals harness (wire capture/replay, micro benchmarks) lives in [`../perf`](../perf/ANALYSIS.md).

## Topology: keeping the server out of the client's numbers

Everything runs as containers inside one Linux VM (colima on macOS here), each pinned to its own vCPUs with `--cpuset-cpus`:

| Process                     | vCPUs | Notes                                                                                                                |
| --------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| MySQL 8.3 (`mysql2-bench`)  | 0–3   | no port published; clients join its network namespace and use `127.0.0.1` (no Docker NAT, no SSH port forwarding)    |
| Client (Node 24 or Bun 1.4) | 8–9   | one fresh container per run (clean JIT/GC state), non-root, read-only root fs, `--cap-drop ALL`, `no-new-privileges` |

Every run records, besides client metrics:

- **server CPU** from the MySQL container's cgroup `cpu.stat`, so a cell where the server saturates (400%) is visible instead of silently capping a driver;
- **foreign load on the client vCPUs** (`/proc/stat` busy time minus the client's own cgroup time), i.e. how much other work in the VM landed on the client's cores;
- **client CPU per query** from `process.cpuUsage()`, cross-checked against the client cgroup (they agree on both runtimes). This is the metric that does not depend on server speed at all.

Why not macOS-native clients: colima's default port forwarder is SSH, which adds latency and host CPU to every packet. Why not `taskset`: macOS has no CPU affinity; Linux cgroups inside the VM do.

## Running

```sh
npm ci --omit=dev --ignore-scripts      # mysql2's runtime deps, from the repo root
docker pull node:24-bookworm-slim && docker pull oven/bun:1.4.5

docker run -d --name mysql2-bench --cpuset-cpus=0-3 --memory=768m -e MALLOC_ARENA_MAX=2 \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -e MYSQL_DATABASE=bench mysql:8.3 \
  --skip-log-bin --innodb-flush-log-at-trx-commit=0 --performance-schema=OFF \
  --innodb-buffer-pool-size=128M --innodb-log-buffer-size=16M --max-connections=500 \
  --max-allowed-packet=64M --skip-name-resolve --host-cache-size=0 \
  --innodb-redo-log-capacity=268435456 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_0900_ai_ci

cd benchmarks/realworld
node run.mjs --setup                                   # schema + 100k users, 10k wide rows, 1 MiB docs
node run.mjs --suite core --reps 3 --out results/core.jsonl
node report.mjs results/core.jsonl                     # markdown tables, medians across reps
```

The server tuning (no binlog, relaxed fsync, no performance schema) lowers server CPU per query so the client is the bottleneck; MySQL has no published port, so the empty root password is reachable only from containers that join its network namespace. `MALLOC_ARENA_MAX=2` and the small buffer pool keep mysqld's memory flat: the colima VM is shared with other containers, and a global OOM in the VM kills the largest process. The orchestrator restarts the server between runs if its anonymous memory passes 400 MB (`BENCH_SERVER_ANON_LIMIT_MB`) and retries a run once if the server died during it.

### `run.mjs` options

| Option                             | Meaning                                                                                                                                                                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--suite`                          | `core`, `large`, `connect`, `noisy`, `sweep`, `openloop`, `pipeline`, `parse` (many rows per query, round trips hidden), `single` (64 callers sharing one `createConnection()`) (repeatable) |
| `--combo`                          | `node/mysql2-query`, `node/mysql2-execute`, `bun/mysql2-query`, `bun/mysql2-execute`, `bun/bun-sql` (repeatable, default all)                                                                |
| `--scenario`                       | filter the suite's jobs to these scenarios (repeatable)                                                                                                                                      |
| `--reps`, `--warmup`, `--duration` | repetitions (run order is shuffled per repetition), seconds of warmup and of measurement                                                                                                     |
| `--rates`                          | arrival rates for `openloop`, e.g. `5000,20000,40000,60000`                                                                                                                                  |
| `--no-trace`, `--opt=key=value`    | mysql2 options: `trace`, `timezone` (`Z`/`local`), `dateStrings`, `maxPreparedStatements` (16/128/16000)                                                                                     |
| `--profile <dir>`                  | write a `.cpuprofile` per run (`--cpu-prof` works on Node and Bun); summarize with `node profile-summary.mjs <file>`                                                                         |

Environment: `BENCH_CLIENT_CPUS` (default `8-9`), `BENCH_SERVER_CONTAINER`, `BENCH_NODE_IMAGE`, `BENCH_BUN_IMAGE`.

## Scenarios

| Scenario        | What it models                                                                    |
| --------------- | --------------------------------------------------------------------------------- |
| `select1`       | protocol and driver overhead only                                                 |
| `pk`            | CRUD read: one row by primary key, 8 columns                                      |
| `list50`        | list page: 50 rows × 8 columns                                                    |
| `insert`        | CRUD create: one small row (InnoDB)                                               |
| `update`        | CRUD update by primary key                                                        |
| `tx`            | `BEGIN; SELECT … FOR UPDATE; UPDATE; INSERT; COMMIT`                              |
| `web`           | one HTTP handler: PK read + 20-row list, 10% of requests also update              |
| `wide100`       | report page: 100 rows × 40 columns (JSON, DATETIME, DATE, DECIMAL, BIGINT, TEXT)  |
| `scan10k`       | export: 10,000 rows × 8 columns                                                   |
| `scan100k`      | large export: all 100,000 rows × 8 columns in one result                          |
| `text1m-read`   | one 1 MiB `LONGTEXT` value read repeatedly                                        |
| `blob1m-read`   | one 1 MiB `LONGBLOB` value read repeatedly                                        |
| `text1m-insert` | 1 MiB string parameter inserted repeatedly (BLACKHOLE table: client-bound)        |
| `blob1m-insert` | 1 MiB Buffer parameter inserted repeatedly (BLACKHOLE table)                      |
| `bulk1000`      | one multi-row INSERT of 1000 rows × 5 columns (BLACKHOLE table)                   |
| `connect`       | serverless style: connect, `SELECT 1`, disconnect                                 |
| `noisy`         | 32 callers doing PK reads while one caller runs 10k-row scans in the same process |

Load profiles: `c1` (1 caller, 1 connection: pure latency), `c8` (8 callers, pool 8), `c64` (64 callers, pool 16: a busy web process), `sweep` (1–1024 callers, pool ≤ 16), `openloop` (Poisson arrivals at a fixed rate; latency is measured from the scheduled arrival, so queueing is included and coordinated omission is avoided), `pipeline` (64 callers on one connection).

mysql2 runs in two modes: `query()` (text protocol, client-side escaping) and `execute()` (server-side prepared statements, binary protocol). Bun.SQL tagged templates always use prepared statements, so `execute()` is the like-for-like comparison.
