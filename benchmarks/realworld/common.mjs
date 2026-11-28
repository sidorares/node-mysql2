import { readFileSync } from 'node:fs';

export function createRng(seed) {
  let x = seed >>> 0 || 0x9e3779b9;
  return {
    next() {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return (x >>> 0) / 4294967296;
    },
    int(min, maxExclusive) {
      return min + Math.floor(this.next() * (maxExclusive - min));
    },
  };
}

export class Samples {
  constructor(initialCapacity = 1 << 16) {
    this.values = new Float64Array(initialCapacity);
    this.length = 0;
  }

  push(value) {
    if (this.length === this.values.length) {
      const grown = new Float64Array(this.values.length * 2);
      grown.set(this.values);
      this.values = grown;
    }
    this.values[this.length++] = value;
  }

  summary() {
    if (this.length === 0) return { n: 0 };
    const sorted = this.values.slice(0, this.length).sort();
    const at = (q) =>
      sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
    let sum = 0;
    for (const v of sorted) sum += v;
    return {
      n: sorted.length,
      mean: sum / sorted.length,
      p50: at(0.5),
      p90: at(0.9),
      p95: at(0.95),
      p99: at(0.99),
      p999: at(0.999),
      max: sorted[sorted.length - 1],
    };
  }
}

export function startLoopMonitor(intervalMs = 10) {
  const lag = new Samples(4096);
  let peakRss = 0;
  let last = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    lag.push(Math.max(0, now - last - intervalMs));
    last = now;
    const { rss } = process.memoryUsage();
    if (rss > peakRss) peakRss = rss;
  }, intervalMs);
  return {
    stop() {
      clearInterval(timer);
      return { lagMs: lag.summary(), peakRssMB: peakRss / 1048576 };
    },
  };
}

function readCgroupUsageUsec(file) {
  try {
    const match = /^usage_usec (\d+)$/m.exec(readFileSync(file, 'utf8'));
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function readCpuTicks(cpuIds) {
  let busy = 0;
  let total = 0;
  try {
    for (const line of readFileSync('/proc/stat', 'utf8').split('\n')) {
      const fields = line.split(' ');
      const id = /^cpu(\d{1,3})$/.exec(fields[0]);
      if (!id || !cpuIds.has(Number(id[1]))) continue;
      const ticks = fields.slice(1).map(Number);
      const idle = ticks[3] + ticks[4];
      const sum = ticks.reduce((a, b) => a + b, 0);
      busy += sum - idle;
      total += sum;
    }
  } catch {
    return null;
  }
  return { busy, total };
}

export function parseCpuList(list) {
  const ids = new Set();
  for (const part of String(list || '').split(',')) {
    const range = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(part.trim());
    if (!range) continue;
    const from = Number(range[1]);
    const to = range[2] === undefined ? from : Number(range[2]);
    for (let i = from; i <= to; i++) ids.add(i);
  }
  return ids;
}

export function startSystemProbe({ serverCgroupFile, clientCpus }) {
  const ownCgroupFile = '/sys/fs/cgroup/cpu.stat';
  const wall0 = performance.now();
  const cpu0 = process.cpuUsage();
  const server0 = serverCgroupFile
    ? readCgroupUsageUsec(serverCgroupFile)
    : null;
  const own0 = readCgroupUsageUsec(ownCgroupFile);
  const ticks0 = clientCpus.size ? readCpuTicks(clientCpus) : null;

  return {
    stop() {
      const wallMs = performance.now() - wall0;
      const cpu = process.cpuUsage(cpu0);
      const server1 = serverCgroupFile
        ? readCgroupUsageUsec(serverCgroupFile)
        : null;
      const own1 = readCgroupUsageUsec(ownCgroupFile);
      const ticks1 = clientCpus.size ? readCpuTicks(clientCpus) : null;

      let foreignLoadPct = null;
      if (ticks0 && ticks1 && own0 !== null && own1 !== null) {
        const busyShare =
          (ticks1.busy - ticks0.busy) / (ticks1.total - ticks0.total);
        const ownShare = (own1 - own0) / 1000 / wallMs / clientCpus.size;
        foreignLoadPct = Math.max(
          0,
          (busyShare - ownShare) * 100 * clientCpus.size
        );
      }

      return {
        wallMs,
        clientUserMs: cpu.user / 1000,
        clientSysMs: cpu.system / 1000,
        serverCpuMs:
          server0 !== null && server1 !== null
            ? (server1 - server0) / 1000
            : null,
        clientCgroupCpuMs:
          own0 !== null && own1 !== null ? (own1 - own0) / 1000 : null,
        foreignLoadPctOnClientCpus: foreignLoadPct,
      };
    },
  };
}

export function makeText(bytes, seed) {
  const rng = createRng(seed);
  const words = [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'café',
    'naïve',
    'données',
    'mysql',
    'packet',
  ];
  const parts = [];
  let size = 0;
  while (size < bytes) {
    const word = words[rng.int(0, words.length)];
    parts.push(word);
    size += Buffer.byteLength(word) + 1;
  }
  return parts.join(' ').slice(0, bytes);
}

export function makeBlob(bytes, seed) {
  const rng = createRng(seed);
  const buffer = Buffer.allocUnsafe(bytes);
  for (let i = 0; i < bytes; i++) buffer[i] = rng.int(0, 256);
  return buffer;
}
