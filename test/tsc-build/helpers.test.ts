import { mysql, mysqlp } from './index.test.js';

export const isResultSetHeader = (
  data: unknown
): data is mysql.ResultSetHeader | mysqlp.ResultSetHeader => {
  if (!data || typeof data !== 'object') return false;

  const keys = [
    'fieldCount',
    'affectedRows',
    'insertId',
    'info',
    'serverStatus',
    'warningStatus',
  ];

  return keys.every((key) => key in data);
};
