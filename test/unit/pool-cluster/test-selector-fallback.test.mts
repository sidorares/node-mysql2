import { describe, it, strict } from 'poku';
import { createPoolCluster } from '../../common.test.mjs';

describe('pool cluster selector fallback', () => {
  it('falls back to the default selector when of() receives an unknown selector', () => {
    const cluster = createPoolCluster({ defaultSelector: 'ORDER' });
    cluster.add('NODE1', { host: '127.0.0.1' });
    cluster.add('NODE2', { host: '127.0.0.1' });

    const namespace = cluster.of('NODE*', 'UNKNOWN');
    // @ts-expect-error: internal access
    strict.equal(namespace._getClusterNode()?.id, 'NODE1');
    // @ts-expect-error: internal access
    strict.equal(namespace._getClusterNode()?.id, 'NODE1');
    strict.equal(namespace, cluster.of('NODE*', 'ORDER'));

    cluster.end();
  });

  it('normalizes lowercase defaultSelector and falls back to RR when defaultSelector is invalid', () => {
    const lowercaseCluster = createPoolCluster({ defaultSelector: 'order' });
    lowercaseCluster.add('NODE1', { host: '127.0.0.1' });
    lowercaseCluster.add('NODE2', { host: '127.0.0.1' });

    const orderNs = lowercaseCluster.of('NODE*', 'INVALID');
    // @ts-expect-error: internal access
    strict.equal(orderNs._getClusterNode()?.id, 'NODE1');
    // @ts-expect-error: internal access
    strict.equal(orderNs._getClusterNode()?.id, 'NODE1');
    lowercaseCluster.end();

    const invalidDefault = createPoolCluster({ defaultSelector: 'INVALID' });
    invalidDefault.add('NODE1', { host: '127.0.0.1' });
    invalidDefault.add('NODE2', { host: '127.0.0.1' });

    const rrNs = invalidDefault.of('NODE*');
    // @ts-expect-error: internal access
    strict.equal(rrNs._getClusterNode()?.id, 'NODE1');
    // @ts-expect-error: internal access
    strict.equal(rrNs._getClusterNode()?.id, 'NODE2');
    invalidDefault.end();
  });
});
