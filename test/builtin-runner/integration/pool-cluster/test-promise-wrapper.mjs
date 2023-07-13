import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import common from '../../../common.js';
import { createPoolCluster } from "../../../../promise.js"

describe('Test pool cluster', { timeout: 1000 }, () => {

  it('should propagate warn event to promise wrapper', (t, done) => {

    const poolCluster = createPoolCluster();
    /* eslint-disable no-invalid-this */
    poolCluster
      .once('warn', function () {
        assert.equal(this, poolCluster);
        done();
      })
    /* eslint-enable no-invalid-this */
    poolCluster.poolCluster.emit('warn', new Error());
  });

  it('should propagate remove event to promise wrapper', (t, done) => {

    const poolCluster = createPoolCluster();
    /* eslint-disable no-invalid-this */
    poolCluster
      .once('remove', function () {
        assert.equal(this, poolCluster);
        done();
      });
    /* eslint-enable no-invalid-this */
    poolCluster.poolCluster.emit('remove');
  });
});
