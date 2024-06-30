import { describe, assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createConnection,
  describeOptions,
} = require('../../../common.test.cjs');

const conn = createConnection({
  typeCast: (field) => field.string(),
}).promise();

describe('typeCast field.string', describeOptions);

const query = new Map();
const execute = new Map();

await conn.query(
  'CREATE TEMPORARY TABLE tmp_tiny (`tiny` TINYINT, `tinyUnsigned` TINYINT UNSIGNED)',
);
await conn.query(
  'CREATE TEMPORARY TABLE tmp_date (`timestamp` TIMESTAMP, `time` TIME)',
);

await conn.query('INSERT INTO tmp_tiny (`tiny`, `tinyUnsigned`) VALUES (0, 1)');
await conn.query(
  'INSERT INTO tmp_date (`timestamp`, `time`) VALUES (CURRENT_TIMESTAMP(), CURTIME())',
);

{
  const [date] = await conn.query('SELECT NOW() AS `now`');
  const [time] = await conn.query('SELECT timestamp, time FROM tmp_date');
  const [tinyint] = await conn.query('SELECT tiny, tinyUnsigned FROM tmp_tiny');

  query.set('date', date[0]);
  query.set('time', time[0]);
  query.set('tiny', tinyint[0]);
}

{
  const [date] = await conn.execute('SELECT NOW() AS `now`');
  const [time] = await conn.execute('SELECT timestamp, time FROM tmp_date');
  const [tinyint] = await conn.query('SELECT tiny, tinyUnsigned FROM tmp_tiny');

  execute.set('date', date[0]);
  execute.set('time', time[0]);
  execute.set('tiny', tinyint[0]);
}

await conn.end();

assert.deepStrictEqual(
  query,
  execute,
  'Ensures the same behavior for field.string',
);
