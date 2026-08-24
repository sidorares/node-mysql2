import { describe, it, strict } from 'poku';
import { createPoolCluster } from '../../common.test.mjs';

function traceOf(
  cluster: ReturnType<typeof createPoolCluster>,
  pattern: string
): boolean {
  // @ts-expect-error: internal access
  return cluster.of(pattern).trace;
}

describe('pool cluster trace flag', () => {
  const empty = createPoolCluster();

  const disabled = createPoolCluster();
  disabled.add('MASTER', { host: '127.0.0.1', trace: false });
  disabled.add('SLAVE', { host: '127.0.0.1', trace: false });

  const mixed = createPoolCluster();
  mixed.add('MASTER', { host: '127.0.0.1' });
  mixed.add('SLAVE', { host: '127.0.0.1', trace: false });

  it('should keep the capture enabled while no node was added', () => {
    strict.equal(traceOf(empty, '*'), true);
  });

  it('should disable the capture when every node opted out', () => {
    strict.equal(traceOf(disabled, '*'), false);
  });

  it('should keep the capture enabled when a node still wants it', () => {
    strict.equal(traceOf(mixed, '*'), true);
  });

  it('should resolve the flag per namespace pattern', () => {
    strict.equal(traceOf(mixed, 'SLAVE'), false);
    strict.equal(traceOf(mixed, 'MASTER'), true);
  });

  empty.end();
  disabled.end();
  mixed.end();
});
