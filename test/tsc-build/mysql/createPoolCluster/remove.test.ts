import { mysql } from '../../index.test.js';

const poolCluster = mysql.createPoolCluster();

// Overload: poolCluster.add(group, connectionUri);
poolCluster.remove('cluster1');
