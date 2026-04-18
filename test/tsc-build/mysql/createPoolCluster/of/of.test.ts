import { mysql } from '../../../index.test.js';
import { access, uriAccess } from '../../baseConnection.test.js';

const poolCluster = mysql.createPoolCluster();

poolCluster.add('cluster1', uriAccess);
poolCluster.add('cluster2', access);

const conn = poolCluster.of('cluster1');

/** @ts-expect-error: PoolNamespace can't be a `PoolConnection` */
conn.release();
