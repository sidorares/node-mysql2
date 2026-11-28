import { readFileSync } from 'node:fs';

const [file, topArg] = process.argv.slice(2);
if (!file) {
  console.error('usage: node profile-summary.mjs <file.cpuprofile> [topN]');
  process.exit(1);
}
const topN = Number(topArg || 25);
const profile = JSON.parse(readFileSync(file, 'utf8'));

const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
const hits = new Map();
for (const id of profile.samples) hits.set(id, (hits.get(id) || 0) + 1);

function location(node) {
  const url = node.callFrame.url || '';
  const lib = url.indexOf('/w/lib/');
  if (lib >= 0) return url.slice(lib + 3);
  const harness = url.indexOf('/w/benchmarks/');
  if (harness >= 0) return 'harness';
  if (url.startsWith('node:')) return url;
  if (url.includes('node_modules/'))
    return url.slice(url.lastIndexOf('node_modules/') + 13).split('/')[0];
  return url ? url.split('/').slice(-2).join('/') : '(native)';
}

const byFunction = new Map();
const byFile = new Map();
let idle = 0;
let total = 0;
for (const [id, count] of hits) {
  const node = nodes.get(id);
  const name = node.callFrame.functionName || '(anonymous)';
  total += count;
  if (name === '(idle)') {
    idle += count;
    continue;
  }
  const where = location(node);
  const line =
    node.callFrame.lineNumber >= 0 ? `:${node.callFrame.lineNumber + 1}` : '';
  const fnKey = `${name} ${where}${where.startsWith('lib/') ? line : ''}`;
  byFunction.set(fnKey, (byFunction.get(fnKey) || 0) + count);
  const fileKey =
    where === '(native)'
      ? `(native) ${name.startsWith('(') ? name : 'builtins'}`
      : where;
  byFile.set(fileKey, (byFile.get(fileKey) || 0) + count);
}

const busy = total - idle;
const pct = (n) => `${((n / busy) * 100).toFixed(1).padStart(5)}%`;
console.log(
  `${file.split('/').pop()}: ${busy} busy samples (${((busy / total) * 100).toFixed(0)}% of wall)\n`
);
console.log('By file (self time, share of busy):');
for (const [key, count] of [...byFile].sort((a, b) => b[1] - a[1]).slice(0, 18))
  console.log(`  ${pct(count)}  ${key}`);
console.log('\nTop functions (self time):');
for (const [key, count] of [...byFunction]
  .sort((a, b) => b[1] - a[1])
  .slice(0, topN))
  console.log(`  ${pct(count)}  ${key}`);
