'use strict';

const Benchmark = require('benchmark');

/**
 * Run a list of benchmark definitions in a new Benchmark.js suite.
 * Returns a Promise that resolves when all tests are complete.
 *
 * @param {Array<{name: string, fn: Function, defer?: boolean}>} benchmarkList
 * @param {Function|null} [teardownFn] - Optional teardown after suite completes.
 */
function runSuite(benchmarkList, teardownFn) {
  return new Promise((resolve) => {
    const suite = new Benchmark.Suite();

    benchmarkList.forEach((b) => {
      if (b.defer) {
        suite.add(b.name, { defer: true, fn: b.fn });
      } else {
        suite.add(b.name, b.fn);
      }
    });

    suite
      .on('complete', () => {
        if (teardownFn) teardownFn();
        resolve();
      })
      .on('cycle', (event) => {
        console.log(String(event.target));
      })
      .run({ async: true });
  });
}

async function main() {
  // ── Unit benchmarks (pure in-process, no I/O) ───────────────────────────
  const unitBenchmarks = require('./unit/packets/column_definition.js');
  await runSuite(unitBenchmarks);

  // ── Integration benchmarks (fake MySQL server, no real DB required) ──────
  const integration = require('./integration/fake-server-select.js');
  await integration.setup();
  await runSuite(integration.benchmarks, integration.teardown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
