import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const COMBOS = [
  'node/mysql2-query',
  'node/mysql2-execute',
  'bun/mysql2-query',
  'bun/mysql2-execute',
  'bun/bun-sql',
];

const median = (values) => {
  const v = values
    .filter((x) => typeof x === 'number' && Number.isFinite(x))
    .sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};

const spread = (values) => {
  const v = values.filter((x) => typeof x === 'number' && Number.isFinite(x));
  if (v.length < 2) return null;
  return (Math.max(...v) - Math.min(...v)) / median(v);
};

function aggregate(records) {
  const groups = new Map();
  for (const r of records) {
    if (!r.ok) continue;
    const key = `${r.scenario}|${r.profile}|${r.combo}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const cells = new Map();
  for (const [key, runs] of groups) {
    const pick = (fn) => median(runs.map(fn));
    cells.set(key, {
      runs: runs.length,
      opsPerSec: pick((r) => r.opsPerSec),
      opsSpread: spread(runs.map((r) => r.opsPerSec)),
      p50: pick((r) => r.latencyMs?.p50),
      p95: pick((r) => r.latencyMs?.p95),
      p99: pick((r) => r.latencyMs?.p99),
      p999: pick((r) => r.latencyMs?.p999),
      max: pick((r) => r.latencyMs?.max),
      schedP50: pick((r) => r.scheduledLatencyMs?.p50),
      schedP99: pick((r) => r.scheduledLatencyMs?.p99),
      schedP999: pick((r) => r.scheduledLatencyMs?.p999),
      dropped: pick((r) => r.droppedArrivals),
      cpuUs: pick((r) => r.clientCpuUsPerOp),
      cpuPct: pick((r) => r.clientCpuPct),
      sysShare: pick((r) => r.clientSysShare),
      serverUs: pick((r) => r.serverCpuUsPerOp),
      serverPct: pick((r) => r.serverCpuPct),
      foreignPct: pick((r) => r.foreignLoadPctOnClientCpus),
      lagP99: pick((r) => r.loopLagMs?.p99),
      lagMax: pick((r) => r.loopLagMs?.max),
      rssMB: pick((r) => r.peakRssMB),
      fairnessCv: pick((r) => r.fairness?.cv),
      scanOps: pick((r) => r.labels?.scan10k?.opsPerSec),
    });
  }
  return cells;
}

const fmt = (value, digits = 0) => {
  if (value === null || value === undefined) return '–';
  if (Math.abs(value) >= 1000 && digits === 0)
    return Math.round(value).toLocaleString('en-US');
  return value.toFixed(digits);
};

function table(title, rows, columns, cell, note) {
  const lines = [`### ${title}`, ''];
  if (note) lines.push(note, '');
  lines.push(
    `| | ${columns.join(' | ')} |`,
    `|---|${columns.map(() => '---:').join('|')}|`
  );
  for (const row of rows)
    lines.push(
      `| ${row.label} | ${columns.map((c) => cell(row, c)).join(' | ')} |`
    );
  return `${lines.join('\n')}\n`;
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { json: { type: 'string' } },
  });
  const records = positionals.flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  );
  const cells = aggregate(records);
  const get = (scenario, profile, combo) =>
    cells.get(`${scenario}|${profile}|${combo}`);
  const scenariosFor = (profile) => [
    ...new Set(
      records.filter((r) => r.profile === profile).map((r) => r.scenario)
    ),
  ];

  const out = [];
  const failed = records.filter((r) => !r.ok);
  out.push(
    `Runs: ${records.length} (${failed.length} failed). Cells are medians across repetitions.\n`
  );

  const metricTable = (title, profile, metric, digits, note) => {
    const rows = scenariosFor(profile).map((s) => ({ label: s, s }));
    if (!rows.length) return;
    out.push(
      table(
        title,
        rows,
        COMBOS,
        (row, c) => fmt(get(row.s, profile, c)?.[metric], digits),
        note
      )
    );
  };

  metricTable('Throughput, ops/s, 64 VUs, pool 16', 'c64', 'opsPerSec', 0);
  metricTable(
    'Client CPU per op (µs), 64 VUs, pool 16',
    'c64',
    'cpuUs',
    1,
    'Lower is better. Pure client cost, independent of server speed.'
  );
  metricTable('p99 latency (ms), 64 VUs, pool 16', 'c64', 'p99', 2);
  metricTable(
    'Server CPU, % of one core, 64 VUs',
    'c64',
    'serverPct',
    0,
    'MySQL has 4 dedicated vCPUs (400%).'
  );
  metricTable(
    'Latency p50 (ms), sequential (1 VU, 1 connection)',
    'c1',
    'p50',
    3
  );
  metricTable('Latency p99 (ms), sequential', 'c1', 'p99', 3);
  metricTable('Client CPU per op (µs), sequential', 'c1', 'cpuUs', 1);
  metricTable('Throughput, ops/s, sequential', 'c1', 'opsPerSec', 0);
  metricTable('Throughput, ops/s, 8 VUs, pool 8', 'c8', 'opsPerSec', 1);
  metricTable('Client CPU per op (µs), 8 VUs, pool 8', 'c8', 'cpuUs', 0);
  metricTable('p99 latency (ms), 8 VUs, pool 8', 'c8', 'p99', 2);
  metricTable('Event-loop lag max (ms), 8 VUs, pool 8', 'c8', 'lagMax', 1);
  metricTable('Peak RSS (MB), 8 VUs, pool 8', 'c8', 'rssMB', 0);

  const sweepProfiles = [
    ...new Set(
      records
        .filter((r) => r.profile?.startsWith('sweep-'))
        .map((r) => r.profile)
    ),
  ].sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));
  if (sweepProfiles.length) {
    const rows = sweepProfiles.map((p) => ({
      label: `${p.replace('sweep-v', '')} VUs`,
      p,
    }));
    out.push(
      table(
        'Concurrency sweep (pk, pool ≤ 16): ops/s',
        rows,
        COMBOS,
        (row, c) => fmt(get('pk', row.p, c)?.opsPerSec),
        null
      )
    );
    out.push(
      table(
        'Concurrency sweep: p99 ms',
        rows,
        COMBOS,
        (row, c) => fmt(get('pk', row.p, c)?.p99, 2),
        null
      )
    );
    out.push(
      table(
        'Concurrency sweep: fairness (CV of per-VU op counts)',
        rows,
        COMBOS,
        (row, c) => fmt(get('pk', row.p, c)?.fairnessCv, 3),
        'Lower is fairer: 0 means every VU completed the same number of queries.'
      )
    );
  }

  const rateProfiles = [
    ...new Set(
      records
        .filter((r) => r.profile?.startsWith('rate-'))
        .map((r) => r.profile)
    ),
  ].sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
  if (rateProfiles.length) {
    const rows = rateProfiles.map((p) => ({
      label: `${Number(p.slice(5)).toLocaleString('en-US')}/s`,
      p,
    }));
    const cellFor = (metric, digits) => (row, c) =>
      fmt(get('pk', row.p, c)?.[metric], digits);
    const note =
      'Poisson arrivals, latency from the scheduled arrival time (includes queueing, no coordinated omission).';
    out.push(
      table(
        'Open loop (pk, pool 16): p50 ms',
        rows,
        COMBOS,
        cellFor('schedP50', 2),
        note
      )
    );
    out.push(
      table('Open loop: p99 ms', rows, COMBOS, cellFor('schedP99', 2), null)
    );
    out.push(
      table('Open loop: p99.9 ms', rows, COMBOS, cellFor('schedP999', 2), null)
    );
    out.push(
      table('Open loop: client CPU %', rows, COMBOS, cellFor('cpuPct', 0), null)
    );
  }

  const noisy = COMBOS.map((c) => ({
    c,
    v: get('noisy', 'noisy33', c),
  })).filter((x) => x.v);
  if (noisy.length) {
    const rows = [
      ['pk ops/s', 'opsPerSec', 0],
      ['pk p50 ms', 'p50', 2],
      ['pk p99 ms', 'p99', 2],
      ['pk max ms', 'max', 1],
      ['10k scans/s', 'scanOps', 1],
      ['loop lag p99 ms', 'lagP99', 1],
      ['loop lag max ms', 'lagMax', 1],
    ].map(([label, metric, digits]) => ({ label, metric, digits }));
    out.push(
      table(
        'Noisy neighbour: 32 VUs of pk + 1 VU of 10k-row scans, pool 16',
        rows,
        COMBOS,
        (row, c) => fmt(get('noisy', 'noisy33', c)?.[row.metric], row.digits),
        null
      )
    );
  }

  const pipe = COMBOS.map((c) => get('pk', 'v64-pool1', c));
  if (pipe.some(Boolean)) {
    out.push(
      table(
        'Single connection, 64 concurrent pk queries (pipelining check)',
        [
          { label: 'ops/s', m: 'opsPerSec', d: 0 },
          { label: 'p99 ms', m: 'p99', d: 2 },
          { label: 'server CPU %', m: 'serverPct', d: 0 },
        ],
        COMBOS,
        (row, c) => fmt(get('pk', 'v64-pool1', c)?.[row.m], row.d),
        null
      )
    );
  }

  const all = [...cells.values()];
  const maxSpread = all
    .map((c) => c.opsSpread)
    .filter((x) => x !== null)
    .sort((a, b) => b - a);
  out.push('### Measurement quality\n');
  out.push(
    `- Foreign load on client vCPUs: median ${fmt(median(all.map((c) => c.foreignPct)), 1)}%, max ${fmt(Math.max(...all.map((c) => c.foreignPct ?? 0)), 1)}% of one core.`
  );
  out.push(
    `- Run-to-run throughput spread (max−min)/median: median ${fmt(median(maxSpread) * 100, 1)}%, p90 ${fmt(maxSpread[Math.floor(maxSpread.length * 0.1)] * 100, 1)}%.`
  );
  out.push(
    `- Highest server CPU in any cell: ${fmt(Math.max(...all.map((c) => c.serverPct ?? 0)))}% of 400%.`
  );
  console.log(out.join('\n'));

  if (values.json) {
    writeFileSync(
      values.json,
      JSON.stringify(Object.fromEntries(cells), null, 1)
    );
  }
}

main();
