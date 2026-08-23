'use strict';

// Aggregates a V8 .cpuprofile: top functions by self time.
// Usage: node profile-summary.js <file.cpuprofile> [topN]

const fs = require('node:fs');

const file = process.argv[2];
const topN = Number(process.argv[3] || 30);
const prof = JSON.parse(fs.readFileSync(file, 'utf8'));

const nodesById = new Map();
for (const node of prof.nodes) {
  nodesById.set(node.id, node);
}

// hit counts per node
const hits = new Map();
for (const id of prof.samples) {
  hits.set(id, (hits.get(id) || 0) + 1);
}
const totalSamples = prof.samples.length;
const totalMicros = prof.endTime - prof.startTime;

function label(node) {
  const cf = node.callFrame;
  const fn = cf.functionName || '(anonymous)';
  let url = cf.url.replace(/^file:\/\//, '');
  const idx = url.indexOf('node-mysql2');
  if (idx >= 0) {
    url = url.slice(url.indexOf('/', idx));
  }
  return `${fn} ${url}${cf.lineNumber >= 0 ? `:${cf.lineNumber + 1}` : ''}`;
}

// aggregate by label (same function can appear as multiple nodes)
const byLabel = new Map();
for (const [id, count] of hits) {
  const node = nodesById.get(id);
  if (!node) continue;
  const l = label(node);
  byLabel.set(l, (byLabel.get(l) || 0) + count);
}

const rows = [...byLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
console.log(
  `total: ${(totalMicros / 1000).toFixed(0)}ms, ${totalSamples} samples\n`
);
for (const [l, count] of rows) {
  const pct = ((count / totalSamples) * 100).toFixed(1).padStart(5);
  const ms = (((count / totalSamples) * totalMicros) / 1000)
    .toFixed(0)
    .padStart(7);
  console.log(`${pct}% ${ms}ms  ${l}`);
}
