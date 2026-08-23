'use strict';

const { PerformanceObserver, constants } = require('node:perf_hooks');

const GC_KIND_NAMES = {
  [constants.NODE_PERFORMANCE_GC_MAJOR]: 'major',
  [constants.NODE_PERFORMANCE_GC_MINOR]: 'minor',
  [constants.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incremental',
  [constants.NODE_PERFORMANCE_GC_WEAKCB]: 'weakcb',
};

function createGcTracker() {
  const totals = { major: 0, minor: 0, incremental: 0, weakcb: 0, count: 0 };
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const kind = GC_KIND_NAMES[entry.detail?.kind] || 'other';
      totals[kind] = (totals[kind] || 0) + entry.duration;
      totals.count++;
    }
  });
  observer.observe({ entryTypes: ['gc'] });
  return {
    totals,
    stop() {
      observer.disconnect();
    },
  };
}

function computeStats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const pick = (q) =>
    sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return {
    n: sorted.length,
    mean: sum / sorted.length,
    p50: pick(0.5),
    p95: pick(0.95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

// Runs `fn` (async, one logical operation) repeatedly: warmup by time, then
// measure by time. Reports per-op latency stats, ops/sec and GC pauses that
// happened inside the measured window.
async function benchAsync(name, fn, opts = {}) {
  const warmupMs = opts.warmupMs ?? 1000;
  const minMs = opts.minMs ?? 3000;
  const maxIter = opts.maxIter ?? Infinity;
  const minIter = opts.minIter ?? 5;

  let t0 = process.hrtime.bigint();
  while (Number(process.hrtime.bigint() - t0) / 1e6 < warmupMs) {
    await fn();
  }

  global.gc?.();
  const gc = createGcTracker();
  const memBefore = process.memoryUsage();
  const samples = [];
  const wallStart = process.hrtime.bigint();
  const cpuStart = process.cpuUsage();
  while (true) {
    t0 = process.hrtime.bigint();
    await fn();
    samples.push(Number(process.hrtime.bigint() - t0) / 1e6);
    const elapsed = Number(process.hrtime.bigint() - wallStart) / 1e6;
    if (
      (elapsed >= minMs && samples.length >= minIter) ||
      samples.length >= maxIter
    ) {
      break;
    }
  }
  const cpu = process.cpuUsage(cpuStart);
  const wallMs = Number(process.hrtime.bigint() - wallStart) / 1e6;
  const memAfter = process.memoryUsage();
  // let queued GC observer entries flush
  await new Promise((r) => setTimeout(r, 100));
  gc.stop();

  const st = computeStats(samples);
  const result = {
    name,
    opsPerSec: (samples.length / wallMs) * 1000,
    latencyMs: st,
    wallMs,
    cpuUserMs: cpu.user / 1000,
    cpuSystemMs: cpu.system / 1000,
    cpuPct: ((cpu.user + cpu.system) / 1000 / wallMs) * 100,
    gcPauseMs: gc.totals,
    heapUsedDeltaMB: (memAfter.heapUsed - memBefore.heapUsed) / 1048576,
    rssMB: memAfter.rss / 1048576,
  };
  report(result);
  return result;
}

function report(result) {
  const r = result;
  const gcTotal =
    r.gcPauseMs.major + r.gcPauseMs.minor + r.gcPauseMs.incremental;
  console.log(
    `${r.name.padEnd(44)} ${r.opsPerSec.toFixed(1).padStart(10)} ops/s | ` +
      `p50 ${r.latencyMs.p50.toFixed(3)}ms p95 ${r.latencyMs.p95.toFixed(3)}ms | ` +
      `cpu ${r.cpuPct.toFixed(0)}% | gc ${gcTotal.toFixed(0)}ms/${r.gcPauseMs.count}`
  );
  if (process.env.BENCH_JSON) {
    console.log(`@@RESULT@@${JSON.stringify(result)}`);
  }
}

module.exports = { benchAsync, computeStats, createGcTracker };
