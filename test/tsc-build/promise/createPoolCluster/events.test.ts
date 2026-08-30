import { mysqlp as mysql } from '../../index.test.js';

const poolCluster = mysql.createPoolCluster();

poolCluster.on('remove', (nodeId) => nodeId.toUpperCase());

// @ts-expect-error: The node id is a string
poolCluster.on('remove', (nodeId) => nodeId.toFixed(2));
