import { execFile } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');

const SERVER = process.env.BENCH_SERVER_CONTAINER || 'mysql2-bench';
const CLIENT_CPUS = process.env.BENCH_CLIENT_CPUS || '8-9';
const IMAGES = {
  node: process.env.BENCH_NODE_IMAGE || 'node:24-bookworm-slim',
  bun: process.env.BENCH_BUN_IMAGE || 'oven/bun:1.4.5',
};

const COMBOS = {
  'node/mysql2-query': { runtime: 'node', driver: 'mysql2-query' },
  'node/mysql2-execute': { runtime: 'node', driver: 'mysql2-execute' },
  'bun/mysql2-query': { runtime: 'bun', driver: 'mysql2-query' },
  'bun/mysql2-execute': { runtime: 'bun', driver: 'mysql2-execute' },
  'bun/bun-sql': { runtime: 'bun', driver: 'bun-sql' },
};

const C1 = { profile: 'c1', vus: 1, pool: 1 };
const C8 = { profile: 'c8', vus: 8, pool: 8 };
const C64 = { profile: 'c64', vus: 64, pool: 16 };

const matrix = (scenarios, profiles) =>
  scenarios.flatMap((scenario) => profiles.map((p) => ({ scenario, ...p })));

const SUITES = {
  core: () =>
    matrix(
      ['select1', 'pk', 'list50', 'insert', 'update', 'tx', 'web', 'wide100'],
      [C1, C64]
    ),
  large: () =>
    matrix(
      [
        'scan10k',
        'text1m-read',
        'blob1m-read',
        'text1m-insert',
        'blob1m-insert',
        'bulk1000',
      ],
      [C1, C8]
    ),
  connect: () => matrix(['connect'], [C1, C8]),
  pipeline: () => matrix(['pk'], [{ profile: 'v64-pool1', vus: 64, pool: 1 }]),
  parse: () => [
    ...matrix(
      ['list50', 'wide100', 'scan10k'],
      [{ profile: 'c32', vus: 32, pool: 16 }]
    ),
    ...matrix(['scan100k'], [C1, { profile: 'c2', vus: 2, pool: 2 }]),
  ],
  single: () =>
    matrix(
      ['select1', 'pk', 'list50', 'wide100'],
      [{ profile: 'v64-conn1', vus: 64, pool: 1, single: true }]
    ),
  noisy: () => [{ scenario: 'noisy', profile: 'noisy33', vus: 33, pool: 16 }],
  sweep: () =>
    [1, 4, 16, 64, 256, 1024].map((vus) => ({
      scenario: 'pk',
      profile: `sweep-v${vus}`,
      vus,
      pool: Math.min(vus, 16),
    })),
  openloop: (rates) =>
    rates.map((rate) => ({
      scenario: 'pk',
      profile: `rate-${rate}`,
      vus: 64,
      pool: 16,
      rate,
    })),
};

function shuffle(items, seed) {
  let x = seed;
  const next = () => (x = (x * 1103515245 + 12345) >>> 0) / 4294967296;
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

async function docker(args, timeoutMs = 120_000) {
  return run('docker', args, {
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  });
}

async function serverCgroupFile() {
  const { stdout } = await docker(['inspect', '--format', '{{.Id}}', SERVER]);
  const id = stdout.trim();
  if (!/^[0-9a-f]{64}$/.test(id))
    throw new Error(`unexpected container id for ${SERVER}`);
  return `/hostcg/docker/${id}/cpu.stat`;
}

function clientArgs(runtime, cgroupFile, scriptArgs, profile) {
  const profileMount = profile ? ['-v', `${profile.dir}:/prof`] : [];
  const runtimeFlags = profile
    ? [
        '--cpu-prof',
        '--cpu-prof-dir=/prof',
        `--cpu-prof-name=${profile.name}.cpuprofile`,
        '--cpu-prof-interval=200',
      ]
    : [];
  return [
    'run',
    '--rm',
    '--network',
    `container:${SERVER}`,
    '--cpuset-cpus',
    CLIENT_CPUS,
    '--memory',
    '1536m',
    '--user',
    '1000:1000',
    '--read-only',
    '--tmpfs',
    '/tmp',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '-e',
    'HOME=/tmp',
    '-e',
    'TZ=UTC',
    '-e',
    `CLIENT_CPUS=${CLIENT_CPUS}`,
    '-e',
    `SERVER_CGROUP_FILE=${cgroupFile}`,
    '-v',
    `${REPO}:/w:ro`,
    '-v',
    '/sys/fs/cgroup:/hostcg:ro',
    ...profileMount,
    '-w',
    '/w/benchmarks/realworld',
    IMAGES[runtime],
    runtime,
    ...runtimeFlags,
    ...scriptArgs,
  ];
}

const SERVER_ANON_LIMIT_MB = Number(
  process.env.BENCH_SERVER_ANON_LIMIT_MB || 400
);

async function serverAnonMB() {
  const { stdout } = await docker([
    'exec',
    SERVER,
    'cat',
    '/sys/fs/cgroup/memory.stat',
  ]);
  const match = /^anon (\d+)$/m.exec(stdout);
  return match ? Number(match[1]) / 1048576 : null;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt++) {
    const probe = await docker([
      'exec',
      SERVER,
      'mysql',
      '-uroot',
      '-N',
      '-e',
      'SELECT 1',
    ]).catch(() => null);
    if (probe && probe.stdout.trim() === '1') return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server container ${SERVER} did not become ready`);
}

async function serverRunning() {
  const { stdout } = await docker([
    'inspect',
    '--format',
    '{{.State.Running}}',
    SERVER,
  ]);
  return stdout.trim() === 'true';
}

async function restartServer() {
  await docker(['restart', SERVER], 180_000);
  await waitForServer();
}

async function runOne(combo, job, timing, cgroupFile, profileDir) {
  const { runtime, driver } = COMBOS[combo];
  const args = [
    'bench.mjs',
    '--driver',
    driver,
    '--scenario',
    job.scenario,
    '--vus',
    String(job.vus),
    '--pool',
    String(job.pool),
    '--rate',
    String(job.rate || 0),
    '--warmup',
    String(timing.warmup),
    '--duration',
    String(timing.duration),
    ...(job.noTrace ? ['--no-trace'] : []),
    ...(job.opts || []).flatMap((o) => ['--opt', o]),
    ...(job.single ? ['--single'] : []),
  ];
  const timeoutMs = (timing.warmup + timing.duration + 60) * 1000;
  try {
    const profile = profileDir
      ? {
          dir: profileDir,
          name: `${combo.replace('/', '_')}-${job.scenario}-${job.profile}`,
        }
      : null;
    const { stdout } = await docker(
      clientArgs(runtime, cgroupFile, args, profile),
      timeoutMs
    );
    const line = stdout.split('\n').find((l) => l.startsWith('@@RESULT@@'));
    if (!line) throw new Error('no result line');
    return { ok: true, ...JSON.parse(line.slice('@@RESULT@@'.length)) };
  } catch (error) {
    return {
      ok: false,
      error: String(error.stderr || error.message).slice(0, 500),
    };
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      suite: { type: 'string', multiple: true, default: ['core'] },
      combo: { type: 'string', multiple: true },
      scenario: { type: 'string', multiple: true },
      reps: { type: 'string', default: '1' },
      warmup: { type: 'string', default: '2' },
      duration: { type: 'string', default: '5' },
      rates: { type: 'string', default: '2000,8000,16000,24000' },
      'no-trace': { type: 'boolean', default: false },
      opt: { type: 'string', multiple: true, default: [] },
      out: { type: 'string' },
      setup: { type: 'boolean', default: false },
      profile: { type: 'string' },
    },
  });

  const cgroupFile = await serverCgroupFile();

  if (values.setup) {
    const { stdout } = await docker(
      clientArgs('node', cgroupFile, ['setup.mjs']),
      600_000
    );
    process.stdout.write(stdout);
    return;
  }

  const combos = values.combo ?? Object.keys(COMBOS);
  for (const combo of combos)
    if (!Object.hasOwn(COMBOS, combo))
      throw new Error(`unknown combo: ${combo}`);
  for (const suite of values.suite)
    if (!Object.hasOwn(SUITES, suite))
      throw new Error(`unknown suite: ${suite}`);

  const rates = values.rates
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  let jobs = values.suite.flatMap((suite) =>
    SUITES[suite](rates).map((job) => ({ suite, ...job }))
  );
  if (values.scenario)
    jobs = jobs.filter((job) => values.scenario.includes(job.scenario));

  const profileDir = values.profile ? resolve(values.profile) : null;
  if (profileDir?.includes(':'))
    throw new Error(
      '--profile path must not contain ":" (docker mount syntax)'
    );
  if (profileDir) mkdirSync(profileDir, { recursive: true });
  const reps = Number(values.reps);
  const timing = {
    warmup: Number(values.warmup),
    duration: Number(values.duration),
  };
  const out = resolve(
    values.out ?? join(HERE, 'results', `run-${Date.now()}.jsonl`)
  );
  mkdirSync(dirname(out), { recursive: true });

  const queue = [];
  for (let rep = 0; rep < reps; rep++) {
    const round = jobs.flatMap((job) =>
      combos.map((combo) => ({
        rep,
        combo,
        job: { ...job, noTrace: values['no-trace'], opts: values.opt },
      }))
    );
    queue.push(...shuffle(round, 7 + rep));
  }

  console.log(`${queue.length} runs -> ${out}`);
  let index = 0;
  for (const { rep, combo, job } of queue) {
    index++;
    let serverRecoveries = 0;
    const ensureServer = async () => {
      if (await serverRunning()) return;
      serverRecoveries++;
      if (serverRecoveries > 2)
        throw new Error(
          `server container ${SERVER} keeps dying; check VM memory (colima ssh -- free -m)`
        );
      console.log(`server container ${SERVER} is down, restarting`);
      await restartServer();
    };
    await ensureServer();
    let result = await runOne(combo, job, timing, cgroupFile, profileDir);
    if (!result.ok && !(await serverRunning())) {
      await ensureServer();
      result = await runOne(combo, job, timing, cgroupFile, profileDir);
    }
    const serverAnonAfterMB = await serverAnonMB();
    const record = {
      rep,
      combo,
      suite: job.suite,
      profile: job.profile,
      opts: job.opts,
      ...result,
      scenario: job.scenario,
      serverAnonAfterMB,
      serverRecoveries,
    };
    appendFileSync(out, `${JSON.stringify(record)}\n`);
    const summary = result.ok
      ? `${result.opsPerSec.toFixed(0)} ops/s p99 ${result.latencyMs.p99.toFixed(2)}ms cli ${result.clientCpuUsPerOp.toFixed(0)}us/op srv ${result.serverCpuPct?.toFixed(0)}% foreign ${result.foreignLoadPctOnClientCpus?.toFixed(0)}%`
      : `FAILED ${result.error.split('\n')[0]}`;
    console.log(
      `[${index}/${queue.length}] ${combo} ${job.scenario}/${job.profile}: ${summary} srvmem ${serverAnonAfterMB?.toFixed(0)}MB`
    );
    if (serverAnonAfterMB > SERVER_ANON_LIMIT_MB) {
      console.log(
        `server anon memory ${serverAnonAfterMB.toFixed(0)}MB > ${SERVER_ANON_LIMIT_MB}MB, restarting ${SERVER}`
      );
      await restartServer();
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
