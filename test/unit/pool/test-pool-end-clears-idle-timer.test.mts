import type { Pool } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../../common.test.mjs';

const idleSweeperTimer = (pool: Pool): NodeJS.Timeout => {
  // @ts-expect-error: internal access
  return pool._removeIdleTimeoutConnectionsTimer;
};

const isDestroyed = (timer: NodeJS.Timeout): boolean => {
  // @ts-expect-error: internal access
  return timer._destroyed;
};

await describe('Pool end clears the idle sweeper timer', async () => {
  const pool = createPool({ connectionLimit: 2, maxIdle: 1 });

  it('starts the sweeper on construction when maxIdle < connectionLimit', () => {
    const timer = idleSweeperTimer(pool);

    strict.ok(timer, 'sweeper timer should be running');
    strict.equal(isDestroyed(timer), false);
  });

  await pool.promise().end();

  it('destroys the sweeper on end so the process can exit', () => {
    strict.equal(isDestroyed(idleSweeperTimer(pool)), true);
  });
});
