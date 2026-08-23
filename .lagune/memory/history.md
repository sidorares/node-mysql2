# Lagune History

## Closed findings

### Unbounded decompression of server-supplied compressed packets

- **Classification:** Medium
- **Category:** Decompression bomb / uncontrolled resource consumption (CWE-409: Improper Handling of Highly Compressed Data; CWE-770: Allocation of Resources Without Limits or Throttling). No CVE assigned.
- **What it is:** When a connection turns on MySQL's client-compression option (`compress: true`) and the server agrees to it, the driver unwraps every incoming packet by running it through zlib inflate. That inflate call is made with no size ceiling, so the driver keeps allocating memory for whatever the server's compressed stream expands to. The 3-byte "length before compression" field in the compressed header is read but only used to tell "already uncompressed" (value 0) apart from "needs inflating" (non-zero). It never caps or checks the real output size, and the actual decompressed size is decided entirely by the bytes the server sent.
- **Closed:** 2026-07-17
