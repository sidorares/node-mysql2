import { mysql } from '../../../index.test.js';
import { access, sqlPS, values } from '../../baseConnection.test.js';

const pool = mysql.createPool(access);

/** A `Pool` exposes the same escaping helpers as a `Connection`. */
export const escapedValue: string = pool.escape(1);
export const escapedId: string = pool.escapeId('table');
export const escapedIds: string = pool.escapeId(['database', 'table']);
export const formatted: string = pool.format(sqlPS, values);
