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

describe('typeCast field.datetime', describeOptions);

const query = {};
const execute = {};

await conn.query('CREATE TEMPORARY TABLE `tmp_date` (`datetime` DATETIME)');

await conn.query('INSERT INTO `tmp_date` (`datetime`) VALUES (CURRENT_DATE())');

{
  const [date] = await conn.execute('SELECT datetime from tmp_date');

  execute.date = date[0].datetime;
}

{
  const [date] = await conn.query('SELECT datetime from tmp_date');

  query.date = date[0].datetime;
}

await conn.end();

assert.equal(execute.date, query.date, 'DATETIME');
