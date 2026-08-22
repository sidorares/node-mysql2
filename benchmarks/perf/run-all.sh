#!/bin/bash
# Runs the full benchmark matrix, one scenario per node process.
# Usage: ./run-all.sh [e2e|replay|all] [port]
set -u
cd "$(dirname "$0")"
MODE="${1:-all}"
PORT="${2:-3308}"

E2E_SCENARIOS="ping select-1-const insert-one-query insert-one-execute \
select-1row-query select-1row-execute \
select-100rows-10cols-query select-100rows-10cols-execute \
select-100rows-100cols-query select-100rows-100cols-execute \
select-10k-query select-10k-execute select-100k-query select-100k-10cols-query \
select-1m-query select-1m-query-arrays \
select-100k-dates-query select-100k-dates-datestrings"

REPLAY_FIXTURES="select-1-const select-1row-10cols select-100rows-10cols \
select-100rows-100cols select-10k-3cols select-100k-3cols select-1m-3cols \
select-100k-dates select-100k-10cols"

if [ "$MODE" = "e2e" ] || [ "$MODE" = "all" ]; then
  echo "=== e2e (port $PORT) ==="
  for s in $E2E_SCENARIOS; do
    MYSQL_PORT=$PORT node --expose-gc e2e.js "$s" || echo "FAILED: $s"
  done
fi

if [ "$MODE" = "replay" ] || [ "$MODE" = "all" ]; then
  echo "=== replay (captured chunking) ==="
  for f in $REPLAY_FIXTURES; do
    node --expose-gc replay.js "$f" captured || echo "FAILED: $f"
  done
  echo "=== replay chunk-size sensitivity (1m fixture) ==="
  for mode in whole 65536 16384 4096; do
    node --expose-gc replay.js select-1m-3cols "$mode" || echo "FAILED: $mode"
  done
  echo "=== replay rowsAsArray ==="
  node --expose-gc replay.js select-1m-3cols captured --rows-as-array
fi
