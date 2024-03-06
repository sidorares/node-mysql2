import { mysql, mysqlp } from './index.test.js';

export const isResultSetHeader = (
  data: unknown,
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

export const isOkPacket = (
  data: unknown,
): data is mysql.OkPacket | mysqlp.OkPacket => {
  if (!data || typeof data !== 'object') return false;

  const keys = [
    'fieldCount',
    'affectedRows',
    'changedRows',
    'insertId',
    'serverStatus',
    'warningCount',
    'message',
    'protocol41',
  ];

  return keys.every((key) => key in data);
};
