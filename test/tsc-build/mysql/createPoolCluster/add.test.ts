import { mysql } from '../../index.test.js';
import { access, uriAccess } from '../baseConnection.test.js';

const poolCluster = mysql.createPoolCluster();

// Overload: poolCluster.add(group, connectionUri) — not covered by .mts
poolCluster.add('cluster1', uriAccess);
// Overload: poolCluster.add(config) — not covered by .mts
poolCluster.add(access);

// @ts-expect-error: The option to pass only `URI` doesn't exists
poolCluster.add(uriAccess);
