import { parseArgs } from 'node:util';
import {
  createRng,
  parseCpuList,
  Samples,
  startLoopMonitor,
  startSystemProbe,
} from './common.mjs';
import { createDriver, DRIVERS } from './drivers.mjs';
import { SCENARIOS } from './scenarios.mjs';

const MAX_IN_FLIGHT = 50_000;
const DRIVER_OPTION_VALUES = {
  timezone: ['Z', 'local'],
  dateStrings: ['true', 'false'],
  trace: ['true', 'false'],
  pipelining: ['16', '32', '64', '128'],
  maxPreparedStatements: ['16', '128', '16000'],
};

function boundedInt(value, name, min, max) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`--${name} must be an integer in [${min}, ${max}]`);
  }
  return n;
}

function parseOptions() {
  const { values } = parseArgs({
    options: {
      driver: { type: 'string' },
      scenario: { type: 'string' },
      vus: { type: 'string', default: '1' },
      pool: { type: 'string', default: '1' },
      rate: { type: 'string', default: '0' },
      warmup: { type: 'string', default: '2' },
      duration: { type: 'string', default: '5' },
      'no-trace': { type: 'boolean', default: false },
      opt: { type: 'string', multiple: true, default: [] },
      single: { type: 'boolean', default: false },
    },
  });
  if (!DRIVERS.includes(values.driver))
    throw new Error(`--driver must be one of ${DRIVERS.join(', ')}`);
  if (!Object.hasOwn(SCENARIOS, values.scenario)) {
    throw new Error(
      `--scenario must be one of ${Object.keys(SCENARIOS).join(', ')}`
    );
  }
  const driverOptions = values['no-trace'] ? { trace: false } : {};
  for (const pair of values.opt) {
    const [key, value] = pair.split('=');
    if (
      !Object.hasOwn(DRIVER_OPTION_VALUES, key) ||
      !DRIVER_OPTION_VALUES[key].includes(value)
    ) {
      throw new Error(
        `--opt ${pair} is not allowed; allowed: ${JSON.stringify(DRIVER_OPTION_VALUES)}`
      );
    }
    driverOptions[key] =
      value === 'true'
        ? true
        : value === 'false'
          ? false
          : /^\d+$/.test(value)
            ? Number(value)
            : value;
  }
  return {
    driverOptions,
    single: values.single,
    driver: values.driver,
    scenario: values.scenario,
    vus: boundedInt(values.vus, 'vus', 1, 10_000),
    pool: boundedInt(values.pool, 'pool', 1, 1000),
    rate: boundedInt(values.rate, 'rate', 0, 1_000_000),
    warmupMs: boundedInt(values.warmup, 'warmup', 0, 600) * 1000,
    durationMs: boundedInt(values.duration, 'duration', 1, 3600) * 1000,
    noTrace: values['no-trace'],
  };
}

function runtimeName() {
  return process.versions.bun
    ? `bun ${process.versions.bun}`
    : `node ${process.versions.node}`;
}

async function main() {
  const opts = parseOptions();
  const scenario = SCENARIOS[opts.scenario];
  const driver = await createDriver(
    opts.driver,
    opts.pool,
    opts.driverOptions,
    opts.single
  );
  const op = driver.kind === 'bun' ? scenario.bun : scenario.mysql2;

  await driver.warm();

  const recorders = new Map();
  const totalLatency = new Samples();
  const recorder = (label) => {
    let samples = recorders.get(label);
    if (!samples) recorders.set(label, (samples = new Samples()));
    return samples;
  };

  let phase = 'warmup';
  let measureStart = Infinity;
  let failure = null;
  let dropped = 0;
  const perVu = new Float64Array(opts.vus);

  const fail = (error) => {
    failure ??= error;
    phase = 'stop';
  };

  let finishMeasure;
  const measured = new Promise((resolve) => (finishMeasure = resolve));
  let probe;
  let loopMonitor;
  setTimeout(() => {
    phase = 'measure';
    measureStart = performance.now();
    probe = startSystemProbe({
      serverCgroupFile: process.env.SERVER_CGROUP_FILE,
      clientCpus: parseCpuList(process.env.CLIENT_CPUS),
    });
    loopMonitor = startLoopMonitor();
    setTimeout(() => {
      const system = probe.stop();
      const loop = loopMonitor.stop();
      phase = 'stop';
      finishMeasure({ system, loop });
    }, opts.durationMs);
  }, opts.warmupMs);

  const workers = [];
  if (opts.rate > 0) {
    const shared = Array.from({ length: Math.min(opts.vus, 64) }, (_, vu) => ({
      vu: vu + 1,
      rng: createRng(1000 + vu),
    }));
    const arrivals = createRng(42);
    let inFlight = 0;
    let launched = 0;
    let nextAt = performance.now();
    const launch = (intendedAt) => {
      if (inFlight >= MAX_IN_FLIGHT) {
        if (phase === 'measure') dropped++;
        return;
      }
      inFlight++;
      const state = shared[launched++ % shared.length];
      const t0 = performance.now();
      op(driver, state).then(
        () => {
          inFlight--;
          if (phase === 'measure' && intendedAt >= measureStart) {
            const t1 = performance.now();
            recorder('op').push(t1 - t0);
            totalLatency.push(t1 - intendedAt);
          }
        },
        (error) => {
          inFlight--;
          fail(error);
        }
      );
    };
    workers.push(
      new Promise((resolve) => {
        const tick = () => {
          if (phase === 'stop') {
            const drain = () =>
              inFlight === 0 ? resolve() : setTimeout(drain, 5);
            return drain();
          }
          const now = performance.now();
          while (nextAt <= now) {
            launch(nextAt);
            nextAt += (-Math.log(1 - arrivals.next()) * 1000) / opts.rate;
          }
          setTimeout(tick, 1);
        };
        tick();
      })
    );
  } else {
    for (let vu = 0; vu < opts.vus; vu++) {
      const state = { vu, rng: createRng(1000 + vu) };
      const samples = recorder(scenario.label ? scenario.label(state) : 'op');
      workers.push(
        (async () => {
          while (phase !== 'stop') {
            const t0 = performance.now();
            try {
              await op(driver, state);
            } catch (error) {
              fail(error);
              return;
            }
            if (phase === 'measure' && t0 >= measureStart) {
              samples.push(performance.now() - t0);
              perVu[vu]++;
            }
          }
        })()
      );
    }
  }

  const { system, loop } = await Promise.race([
    measured,
    Promise.all(workers).then(() => {
      if (failure) throw failure;
      throw new Error('workers exited before the measurement window closed');
    }),
  ]);
  await Promise.all(workers);
  await driver.close();
  if (failure) throw failure;

  const seconds = system.wallMs / 1000;
  const labels = {};
  for (const [label, samples] of recorders) {
    const latencyMs = samples.summary();
    labels[label] = {
      ops: latencyMs.n,
      opsPerSec: latencyMs.n / seconds,
      latencyMs,
    };
  }
  const primary = labels.op ?? labels.pk;
  const totalOps = [...recorders.values()].reduce(
    (sum, s) => sum + s.length,
    0
  );
  const clientCpuMs = system.clientUserMs + system.clientSysMs;

  let fairness = null;
  if (!opts.rate && !scenario.label && opts.vus > 1) {
    const counts = [...perVu];
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const sd = Math.sqrt(
      counts.reduce((a, c) => a + (c - mean) ** 2, 0) / counts.length
    );
    fairness = {
      minOps: Math.min(...counts),
      maxOps: Math.max(...counts),
      cv: mean ? sd / mean : null,
    };
  }

  const result = {
    runtime: runtimeName(),
    ...opts,
    opsPerSec: primary ? primary.opsPerSec : 0,
    latencyMs: primary ? primary.latencyMs : null,
    scheduledLatencyMs: opts.rate ? totalLatency.summary() : null,
    droppedArrivals: dropped,
    labels,
    rowsPerOp: scenario.rows ?? null,
    clientCpuPct: (clientCpuMs / system.wallMs) * 100,
    clientCpuUsPerOp: totalOps ? (clientCpuMs * 1000) / totalOps : null,
    clientCgroupCpuPct:
      system.clientCgroupCpuMs === null
        ? null
        : (system.clientCgroupCpuMs / system.wallMs) * 100,
    clientSysShare: clientCpuMs ? system.clientSysMs / clientCpuMs : null,
    serverCpuPct:
      system.serverCpuMs === null
        ? null
        : (system.serverCpuMs / system.wallMs) * 100,
    serverCpuUsPerOp:
      system.serverCpuMs === null || !totalOps
        ? null
        : (system.serverCpuMs * 1000) / totalOps,
    foreignLoadPctOnClientCpus: system.foreignLoadPctOnClientCpus,
    loopLagMs: loop.lagMs,
    peakRssMB: loop.peakRssMB,
    fairness,
  };
  console.log(`@@RESULT@@${JSON.stringify(result)}`);
}

main().catch((error) => {
  console.error(`benchmark failed: ${error && error.message}`);
  process.exit(1);
});
