'use strict';

// Isolated benchmark for outgoing packet serialization (toPacket): the
// client->server write path. No server, no socket, sync tight loop.
//
// Usage: node benchmarks/perf/serialize.js [filter]
//        node benchmarks/perf/serialize.js --alloc   (allocation-strategy micro)

const Query = require('../../lib/packets/query.js');
const Execute = require('../../lib/packets/execute.js');
const ClientConstants = require('../../lib/constants/client.js');
const { types } = require('../../lib/packets/typed_parameter.js');

const QA = ClientConstants.CLIENT_QUERY_ATTRIBUTES;
const CHARSET = 224; // utf8mb4_unicode_ci

const now = () => process.hrtime.bigint();
const ms = (delta) => Number(delta) / 1e6;

function bench(name, fn, opts = {}) {
  const batch = opts.batch || 1000;
  const minMs = opts.minMs || Number(process.env.BENCH_MS || 1500);
  const warmupMs = opts.warmupMs || 400;
  let sink = 0;
  let t0 = now();
  while (ms(now() - t0) < warmupMs) {
    for (let i = 0; i < batch; i++) {
      sink += fn();
    }
  }
  let iters = 0;
  t0 = now();
  let elapsed = 0;
  do {
    for (let i = 0; i < batch; i++) {
      sink += fn();
    }
    iters += batch;
    elapsed = ms(now() - t0);
  } while (elapsed < minMs);
  const opsPerSec = iters / (elapsed / 1000);
  const nsPerOp = (elapsed * 1e6) / iters;
  console.log(
    `${name.padEnd(34)} ${Math.round(opsPerSec).toString().padStart(12)} ops/s | ${nsPerOp.toFixed(0).padStart(8)} ns/op`
  );
  if (process.env.BENCH_JSON) {
    console.log(`@@RESULT@@${JSON.stringify({ name, opsPerSec, nsPerOp })}`);
  }
  return sink;
}

const shortStrings = Array.from(
  { length: 10 },
  (_, i) => `value-${i}-abcdefghijklmnopqrstuvw`
);
const dates = [
  new Date(2026, 0, 15, 10, 30, 0),
  new Date(2026, 5, 1, 0, 0, 1, 500),
  new Date(2026, 11, 31, 23, 59, 59),
];
const blob16k = Buffer.alloc(16384, 0xab);

const scenarios = {
  'query-select-1': () =>
    new Query('SELECT 1', CHARSET, undefined, QA).toPacket().buffer.length,
  'query-insert-120b': () =>
    new Query(
      `INSERT INTO t_insert (a, b) VALUES (42, '${'x'.repeat(80)}')`,
      CHARSET,
      undefined,
      QA
    ).toPacket().buffer.length,
  'query-2-attrs': () =>
    new Query(
      'SELECT 1',
      CHARSET,
      { trace_id: 'abc123ef', span_id: '0011223344' },
      QA
    ).toPacket().buffer.length,
  'execute-0-params': () =>
    new Execute(5, [], CHARSET, 'local', undefined, QA).toPacket().buffer
      .length,
  'execute-3-params': () =>
    new Execute(
      5,
      [42, 'hello world payload', 3.1415],
      CHARSET,
      'local',
      undefined,
      QA
    ).toPacket().buffer.length,
  'execute-3-params-noattrs': () =>
    new Execute(
      5,
      [42, 'hello world payload', 3.1415],
      CHARSET,
      'local',
      undefined,
      0
    ).toPacket().buffer.length,
  'execute-10-strings': () =>
    new Execute(5, shortStrings, CHARSET, 'local', undefined, QA).toPacket()
      .buffer.length,
  'execute-3-dates': () =>
    new Execute(5, dates, CHARSET, 'local', undefined, QA).toPacket().buffer
      .length,
  'execute-typed-mixed': () =>
    new Execute(
      5,
      [
        types.BIGINT(1234567890123n),
        types.VARCHAR('abcdefgh'),
        types.DATETIME(dates[0]),
      ],
      CHARSET,
      'local',
      undefined,
      QA
    ).toPacket().buffer.length,
  'execute-attrs-3-params': () =>
    new Execute(
      5,
      [42, 'hello world payload', 3.1415],
      CHARSET,
      'local',
      {
        traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
      },
      QA
    ).toPacket().buffer.length,
  'execute-blob-16k': () =>
    new Execute(5, [blob16k], CHARSET, 'local', undefined, QA).toPacket().buffer
      .length,
};

const allocScenarios = () => {
  // What a buffer pool could save at best: allocation cost alone, by size.
  for (const size of [32, 256, 1024, 4096, 16384, 65536, 1048576]) {
    const batch = size >= 65536 ? 200 : 2000;
    bench(`allocUnsafe-${size}`, () => Buffer.allocUnsafe(size).length, {
      batch,
    });
  }
  const slab = Buffer.allocUnsafe(1 << 20);
  for (const size of [32, 256, 1024, 4096, 16384, 65536]) {
    // pool best case: no allocation, only an exact-size view of a pooled slab
    bench(`slab-subarray-${size}`, () => slab.subarray(0, size).length, {
      batch: 2000,
    });
    // scratch strategy: serialize into slab, copy out an exact-size buffer
    bench(
      `slab-copy-out-${size}`,
      () => {
        const out = Buffer.allocUnsafe(size);
        slab.copy(out, 0, 0, size);
        return out.length;
      },
      { batch: 2000 }
    );
  }
};

function main() {
  const arg = process.argv[2];
  if (arg === '--alloc') {
    allocScenarios();
    return;
  }
  let total = 0;
  for (const [name, fn] of Object.entries(scenarios)) {
    if (arg && !name.includes(arg)) {
      continue;
    }
    const batch = name.includes('blob-16k') ? 200 : 1000;
    total += bench(name, fn, { batch });
  }
  console.log(`(sink ${total & 0xffff})`);
}

main();
