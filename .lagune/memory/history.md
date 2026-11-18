# Lagune History

## Closed findings

### Unbounded decompression of server-supplied compressed packets

- **Classification:** Medium
- **Category:** Decompression bomb / uncontrolled resource consumption (CWE-409: Improper Handling of Highly Compressed Data; CWE-770: Allocation of Resources Without Limits or Throttling). No CVE assigned.
- **What it is:** When a connection turns on MySQL's client-compression option (`compress: true`) and the server agrees to it, the driver unwraps every incoming packet by running it through zlib inflate. That inflate call is made with no size ceiling, so the driver keeps allocating memory for whatever the server's compressed stream expands to. The 3-byte "length before compression" field in the compressed header is read but only used to tell "already uncompressed" (value 0) apart from "needs inflating" (non-zero). It never caps or checks the real output size, and the actual decompressed size is decided entirely by the bytes the server sent.
- **Closed:** 2026-07-17

### LOCAL INFILE stream left attached after a load ends abnormally

- **Classification:** High
- **Category:** Denial of service through an uncaught exception (CWE-248) and listeners never released (CWE-772)
- **What it is:** When the application opts into LOCAL INFILE with a stream factory, the driver wires the file stream to the connection (data, end, and error on the stream, pause and drain on the socket) and keeps a single cleanup slot that only the command's normal completion runs. [#4661](https://github.com/sidorares/node-mysql2/pull/4661) reworked the failure path: a failed load now reads the server's response to the end, stops sending once the stream errors, and answers any further file request in the same command with an empty file, without calling the factory. The single cleanup slot and the load path `execute()` borrows predate v3.24.6. The opt-in still holds: without a factory, no file is read.
- **Closed:** 2026-11-17

### Object expansion into column assignments with expand()

- **Classification:** Medium
- **Category:** Mass assignment through caller-chosen column names (CWE-915)
- **What it is:** Since [#4669](https://github.com/sidorares/node-mysql2/pull/4669), both entry points export `expand()`. A value wrapped in it becomes `` `key` = value `` pairs at any `?` placeholder, no longer only inside a `SET` or `ON DUPLICATE KEY UPDATE` list. Each key is quoted as an identifier (a key with a dot becomes a qualified table and column name) and each value is escaped, even with `stringifyObjects` on. The mark is a property under a global symbol, so only code can create it: parsed JSON or a query string cannot forge one. `execute()` rejects a mark among its parameters with a `TypeError`.
- **Closed:** 2026-11-18
