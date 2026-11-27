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

### Escaping that follows the session's NO_BACKSLASH_ESCAPES mode

- **Classification:** Critical
- **Category:** SQL injection (CWE-89) from escaping written for a different SQL mode than the session's (CWE-116)
- **What it is:** Since [#4684](https://github.com/sidorares/node-mysql2/pull/4684), the driver escapes values for the session's `NO_BACKSLASH_ESCAPES` SQL mode. The connection keeps the server status flags from every OK and EOF packet, and while the flag is on it escapes a quote by doubling it instead of putting a backslash in front of it. A query queued behind another command is escaped for both modes, and the version matching the flag at send time is the one sent. Prepared statements are unaffected, because their values never enter the SQL text.
- **Closed:** 2026-11-18

### Backtracking trailing-zero trim on server TIME fractions

- **Classification:** Medium
- **Category:** Regular expression denial of service (CWE-1333)
- **What it is:** The TIME reader trims the trailing zeros of the server's microseconds with the pattern `0+$`, which the regex checker rates as unsafe: quadratic backtracking on a search. The pattern dates from v2.3.1. In the pending release, [#4677](https://github.com/sidorares/node-mysql2/pull/4677) made the reader use the column's reported fraction digits and left the trim only as the fallback, where before it ran on every TIME value with a fraction.
- **Closed:** 2026-11-18
