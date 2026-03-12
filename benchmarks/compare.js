'use strict';

/**
 * Compare two Benchmark.js output files and print a Markdown summary.
 *
 * Usage:
 *   node benchmarks/compare.js <baseline.txt> <current.txt>
 *
 * Exits with code 1 if any benchmark regressed beyond REGRESSION_THRESHOLD.
 */

const fs = require('fs');

/** Threshold above which a slowdown is flagged as a regression (15 %). */
const REGRESSION_THRESHOLD = 0.85; // current/baseline ratio below this → regression
/** Noise floor: changes smaller than ±0.5 % are shown as neutral (✅). */
const NOISE_FLOOR = 0.005;

/**
 * Parse lines that match the Benchmark.js output format:
 *   <name> x <ops/sec> ops/sec ±<margin>% (<samples> runs sampled)
 *
 * @param {string} content
 * @returns {Map<string, {opsPerSec: number, margin: number, samples: number}>}
 */
function parseBenchmarkOutput(content) {
  const results = new Map();
  for (const line of content.split('\n')) {
    const m = line.match(
      /^(.+?) x ([\d,]+(?:\.\d+)?) ops\/sec ±([\d.]+)% \((\d+) runs sampled\)/
    );
    if (m) {
      results.set(m[1].trim(), {
        opsPerSec: parseFloat(m[2].replace(/,/g, '')),
        margin: parseFloat(m[3]),
        samples: parseInt(m[4], 10),
      });
    }
  }
  return results;
}

function formatOps(n) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function ratioLabel(ratio) {
  const pct = ((ratio - 1) * 100).toFixed(1);
  if (ratio >= 1 + NOISE_FLOOR) return `**+${pct}%** 🚀`;
  if (ratio <= REGRESSION_THRESHOLD) return `**${pct}%** 🔴`;
  if (ratio < 1 - NOISE_FLOOR) return `${pct}% 🟡`;
  return `${pct}% ✅`;
}

function main() {
  const [baselineFile, currentFile] = process.argv.slice(2);
  if (!baselineFile || !currentFile) {
    console.error(
      'Usage: node benchmarks/compare.js <baseline.txt> <current.txt>'
    );
    process.exit(2);
  }

  const baseline = parseBenchmarkOutput(fs.readFileSync(baselineFile, 'utf8'));
  const current = parseBenchmarkOutput(fs.readFileSync(currentFile, 'utf8'));

  const allNames = new Set([...baseline.keys(), ...current.keys()]);

  let hasRegression = false;

  const rows = [];
  for (const name of allNames) {
    const b = baseline.get(name);
    const c = current.get(name);

    if (!b) {
      rows.push(
        `| ${name} | — | ${formatOps(c.opsPerSec)} ops/sec ±${c.margin}% | new benchmark |`
      );
    } else if (!c) {
      rows.push(
        `| ${name} | ${formatOps(b.opsPerSec)} ops/sec ±${b.margin}% | — | removed |`
      );
    } else {
      const ratio = c.opsPerSec / b.opsPerSec;
      if (ratio < REGRESSION_THRESHOLD) hasRegression = true;
      rows.push(
        `| ${name} | ${formatOps(b.opsPerSec)} ops/sec ±${b.margin}% | ${formatOps(c.opsPerSec)} ops/sec ±${c.margin}% | ${ratioLabel(ratio)} |`
      );
    }
  }

  console.log('## Benchmark Comparison\n');
  console.log(
    '> Baseline: base branch — Current: this PR — same runner, same job.\n'
  );
  console.log('| Benchmark | Baseline | Current | Change |');
  console.log('|-----------|----------|---------|--------|');
  for (const row of rows) console.log(row);

  if (hasRegression) {
    console.log(
      '\n> [!WARNING]\n> One or more benchmarks regressed by more than 15%. Please investigate before merging.\n'
    );
    process.exit(1);
  } else {
    console.log('\n> [!NOTE]\n> No significant regressions detected.\n');
  }
}

main();
