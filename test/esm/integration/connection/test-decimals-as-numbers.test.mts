import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
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

    assert.equal(rows1[0].d1.constructor, String);
    assert.equal(rows1[0].d1, largeDecimalExpected);
  });

  await it('should return decimals as numbers when decimalNumbers is true', async () => {
    const rows2 = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection2.query<RowDataPacket[]>('select d1 from t2', (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    assert.equal(rows2[0].d1.constructor, Number);
    assert.equal(rows2[0].d1, largeMoneyValue);
  });

  connection1.end();
  connection2.end();
});
