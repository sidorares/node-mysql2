#!/bin/sh
# Runs the repository's test suite in a Linux container against the
# benchmark server (see README.md), from a copy of the working tree with its
# own Linux node_modules. FORCE_PIPELINING=1 enables pipelining on every
# connection; pass a test file to run only that file.
set -eu
REPO=$(cd "$(dirname "$0")/../.." && pwd)
docker run --rm --network container:"${BENCH_SERVER_CONTAINER:-mysql2-bench}" \
  --user 1000:1000 --memory 800m --tmpfs /tmp:exec,size=1g \
  -e HOME=/tmp -e MYSQL_HOST=127.0.0.1 -e FORCE_PIPELINING="${FORCE_PIPELINING:-0}" \
  -v "$REPO":/w:ro node:24-bookworm-slim sh -c '
    set -e
    mkdir -p /tmp/repo
    cd /w && tar --exclude=./node_modules --exclude=./website --exclude=./.git \
      --exclude=./benchmarks/realworld/results --exclude=./benchmarks/realworld/profiles \
      -cf - . | tar -xf - -C /tmp/repo
    cd /tmp/repo
    npm ci --ignore-scripts --no-audit --no-fund > /dev/null 2>&1
    sed -i "s/concurrency: 8/concurrency: 4/" poku.config.js
    if [ "$FORCE_PIPELINING" = 1 ]; then
      export NODE_OPTIONS="--require /tmp/repo/benchmarks/realworld/force-pipelining.cjs"
    fi
    if [ -n "${1:-}" ]; then npx tsx "$1"; else npx poku; fi
  ' sh "${1:-}"
