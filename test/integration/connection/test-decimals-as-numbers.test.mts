import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Decimals as Numbers', async () => {
  const connection1 = createConnection({
    decimalNumbers: false,
  });
  const connection2 = createConnection({
    decimalNumbers: true,
  });

  const largeDecimal = 900719.547409;
  const largeDecimalExpected = '900719.547409000000000000000000000000';
  const largeMoneyValue = 900719925474.99;

  connection1.query('CREATE TEMPORARY TABLE t1 (d1 DECIMAL(65, 30))');
  connection1.query('INSERT INTO t1 set d1=?', [largeDecimal]);

  connection2.query('CREATE TEMPORARY TABLE t2 (d1 DECIMAL(14, 2))');
  connection2.query('INSERT INTO t2 set d1=?', [largeMoneyValue]);

  await it('should return decimals as strings when decimalNumbers is false', async () => {
    const rows1 = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection1.execute<RowDataPacket[]>('select d1 from t1', (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    strict.equal(rows1[0].d1.constructor, String);
    strict.equal(rows1[0].d1, largeDecimalExpected);
  });

  await it('should return decimals as numbers when decimalNumbers is true', async () => {
    const rows2 = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection2.query<RowDataPacket[]>('select d1 from t2', (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    strict.equal(rows2[0].d1.constructor, Number);
    strict.equal(rows2[0].d1, largeMoneyValue);
  });

  await it('should parse DECIMAL(36,18) with many fractional digits correctly (issue #3690)', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection2.query<RowDataPacket[]>(
        'SELECT CAST("+50000.000000000000000000" AS DECIMAL(36,18)) as big_decimal',
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    strict.equal(rows[0].big_decimal.constructor, Number);
    strict.equal(rows[0].big_decimal, 50000);
  });

  await it('should parse DOUBLE with scientific notation correctly (issue #2928)', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection2.query<RowDataPacket[]>(
        'SELECT +1.7976931348623157e308 as max_double, ' +
          '-1.7976931348623157e308 as min_double, ' +
          '1e100 as sci_notation',
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    strict.equal(rows[0].max_double, 1.7976931348623157e308);
    strict.equal(rows[0].min_double, -1.7976931348623157e308);
    strict.equal(rows[0].sci_notation, 1e100);
  });

  connection1.end();
  connection2.end();
});
