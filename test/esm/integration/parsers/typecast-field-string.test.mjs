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

const query = {};
const execute = {};

await conn.query(
  'CREATE TEMPORARY TABLE `tmp_tiny` (`signed` TINYINT, `unsigned` TINYINT UNSIGNED)',
);
await conn.query('CREATE TEMPORARY TABLE `tmp_date` (`timestamp` TIMESTAMP)');

await conn.query('INSERT INTO `tmp_tiny` (`signed`, `unsigned`) VALUES (0, 1)');
await conn.query(
  'INSERT INTO `tmp_date` (`timestamp`) VALUES (CURRENT_TIMESTAMP())',
);

{
  const [date] = await conn.query(
    'SELECT STR_TO_DATE("2022-06-28", "%Y-%m-%d") AS `date`',
  );
  const [time] = await conn.query(
    'SELECT STR_TO_DATE("12:34:56", "%H:%i:%s") AS `time`',
  );
  const [datetime] = await conn.query(
    'SELECT STR_TO_DATE("2022-06-28 12:34:56", "%Y-%m-%d %H:%i:%s") AS `datetime`',
  );
  const [timestamp] = await conn.query('SELECT `timestamp` FROM `tmp_date`');
  const [tiny] = await conn.query(
    'SELECT `signed`, `unsigned` FROM `tmp_tiny`',
  );

  query.date = date[0].date;
  query.time = time[0].time;
  query.timestamp = timestamp[0].timestamp;
  query.datetime = datetime[0].datetime;
  query.tiny = tiny[0];
}

{
  const [date] = await conn.execute(
    'SELECT STR_TO_DATE("2022-06-28", "%Y-%m-%d") AS `date`',
  );
  const [time] = await conn.execute(
    'SELECT STR_TO_DATE("12:34:56", "%H:%i:%s") AS `time`',
  );
  const [datetime] = await conn.execute(
    'SELECT STR_TO_DATE("2022-06-28 12:34:56", "%Y-%m-%d %H:%i:%s") AS `datetime`',
  );
  const [timestamp] = await conn.execute('SELECT `timestamp` FROM `tmp_date`');
  const [tiny] = await conn.execute(
    'SELECT `signed`, `unsigned` FROM `tmp_tiny`',
  );

  execute.date = date[0].date;
  execute.time = time[0].time;
  execute.timestamp = timestamp[0].timestamp;
  execute.datetime = datetime[0].datetime;
  execute.tiny = tiny[0];
}

await conn.end();

assert.deepStrictEqual(query.date, execute.date, 'DATE');
assert.deepStrictEqual(query.time, execute.time, 'TIME');
assert.deepStrictEqual(query.datetime, execute.datetime, 'DATETIME');
assert.deepStrictEqual(query.timestamp, execute.timestamp, 'TIMESTAMP');
assert.deepStrictEqual(query.tiny.signed, execute.tiny.signed, 'TINY (signed)');
assert.deepStrictEqual(
  query.tiny.unsigned,
  execute.tiny.unsigned,
  'TINY (unsigned)',
);
