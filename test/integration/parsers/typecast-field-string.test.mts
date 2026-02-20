import type { RowDataPacket, TypeCastField } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type DateRow = RowDataPacket & { date: string | null };
type TimeRow = RowDataPacket & { time: string | null };
type DatetimeRow = RowDataPacket & { datetime: string | null };
type TimestampRow = RowDataPacket & { timestamp: string | null };
type TinyRow = RowDataPacket & {
  signed: string | null;
  unsigned: string | null;
};

await describe('typeCast field.string', async () => {
  const conn = createConnection({
    typeCast: (field: TypeCastField) => field.string(),
  }).promise();

  const query = {} as {
    date: string | null;
    time: string | null;
    datetime: string | null;
    timestamp: string | null;
    tiny: { signed: string | null; unsigned: string | null };
  };
  const execute = {} as typeof query;

  await conn.query(
    'CREATE TEMPORARY TABLE `tmp_tiny` (`signed` TINYINT, `unsigned` TINYINT UNSIGNED)'
  );
  await conn.query('CREATE TEMPORARY TABLE `tmp_date` (`timestamp` TIMESTAMP)');

  await conn.query(
    'INSERT INTO `tmp_tiny` (`signed`, `unsigned`) VALUES (0, 1)'
  );
  await conn.query(
    'INSERT INTO `tmp_date` (`timestamp`) VALUES (CURRENT_TIMESTAMP())'
  );

  await it('query results', async () => {
    const [date] = await conn.query<DateRow[]>(
      'SELECT STR_TO_DATE("2022-06-28", "%Y-%m-%d") AS `date`'
    );
    const [time] = await conn.query<TimeRow[]>(
      'SELECT STR_TO_DATE("12:34:56", "%H:%i:%s") AS `time`'
    );
    const [datetime] = await conn.query<DatetimeRow[]>(
      'SELECT STR_TO_DATE("2022-06-28 12:34:56", "%Y-%m-%d %H:%i:%s") AS `datetime`'
    );
    const [timestamp] = await conn.query<TimestampRow[]>(
      'SELECT `timestamp` FROM `tmp_date`'
    );
    const [tiny] = await conn.query<TinyRow[]>(
      'SELECT `signed`, `unsigned` FROM `tmp_tiny`'
    );

    query.date = date[0].date;
    query.time = time[0].time;
    query.timestamp = timestamp[0].timestamp;
    query.datetime = datetime[0].datetime;
    query.tiny = tiny[0];
  });

  await it('execute results', async () => {
    const [date] = await conn.execute<DateRow[]>(
      'SELECT STR_TO_DATE("2022-06-28", "%Y-%m-%d") AS `date`'
    );
    const [time] = await conn.execute<TimeRow[]>(
      'SELECT STR_TO_DATE("12:34:56", "%H:%i:%s") AS `time`'
    );
    const [datetime] = await conn.execute<DatetimeRow[]>(
      'SELECT STR_TO_DATE("2022-06-28 12:34:56", "%Y-%m-%d %H:%i:%s") AS `datetime`'
    );
    const [timestamp] = await conn.execute<TimestampRow[]>(
      'SELECT `timestamp` FROM `tmp_date`'
    );
    const [tiny] = await conn.execute<TinyRow[]>(
      'SELECT `signed`, `unsigned` FROM `tmp_tiny`'
    );

    execute.date = date[0].date;
    execute.time = time[0].time;
    execute.timestamp = timestamp[0].timestamp;
    execute.datetime = datetime[0].datetime;
    execute.tiny = tiny[0];
  });

  await conn.end();

  it(() => {
    assert.deepStrictEqual(query.date, execute.date, 'DATE');
    assert.deepStrictEqual(query.time, execute.time, 'TIME');
    assert.deepStrictEqual(query.datetime, execute.datetime, 'DATETIME');
    assert.deepStrictEqual(query.timestamp, execute.timestamp, 'TIMESTAMP');
    assert.deepStrictEqual(
      query.tiny.signed,
      execute.tiny.signed,
      'TINY (signed)'
    );
    assert.deepStrictEqual(
      query.tiny.unsigned,
      execute.tiny.unsigned,
      'TINY (unsigned)'
    );
  });
});
