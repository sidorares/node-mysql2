import type { RowDataPacket, TypeCastField } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type DateRow = RowDataPacket & { datetime: string | null };

await describe('typeCast field.datetime', async () => {
  const conn = createConnection({
    typeCast: (field: TypeCastField) => field.string(),
  }).promise();

  const query = {} as {
    date: string | null;
  };
  const execute = {} as typeof query;

  await conn.query('CREATE TEMPORARY TABLE `tmp_date` (`datetime` DATETIME)');

  await conn.query(
    'INSERT INTO `tmp_date` (`datetime`) VALUES (CURRENT_DATE())'
  );

  await it('execute results', async () => {
    const [date] = await conn.execute<DateRow[]>(
      'SELECT datetime from tmp_date'
    );

    execute.date = date[0].datetime;
  });

  await it('query results', async () => {
    const [date] = await conn.query<DateRow[]>('SELECT datetime from tmp_date');

    query.date = date[0].datetime;
  });

  await conn.end();

  it(() => {
    assert.equal(execute.date, query.date, 'DATETIME');
  });
});
