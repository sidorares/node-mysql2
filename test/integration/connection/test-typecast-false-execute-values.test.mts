import type { RowDataPacket } from '../../../promise.js';
import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

const floatBytes = Buffer.alloc(4);
floatBytes.writeFloatLE(1.5);

const doubleBytes = Buffer.alloc(8);
doubleBytes.writeDoubleLE(-2.25);

await describe('typeCast: false on execute returns the bytes of each value', async () => {
  const connection = createConnection().promise();

  await connection.query(`CREATE TEMPORARY TABLE typecast_false_values (
    t TINYINT, s SMALLINT, m MEDIUMINT, i INT, b BIGINT, f FLOAT, d DOUBLE,
    y YEAR, n DECIMAL(5, 2), v VARCHAR(8), dt DATE, ts DATETIME, tm TIME, z INT
  )`);
  await connection.query(`INSERT INTO typecast_false_values VALUES (
    -1, 258, 65538, 16909060, -2, 1.5, -2.25, 2024, 3.14, 'abc',
    '2024-01-02', '2024-01-02 03:04:05', '01:02:03', NULL
  )`);

  const [rows] = await connection.execute<RowDataPacket[]>({
    sql: 'SELECT * FROM typecast_false_values',
    typeCast: false,
  });

  it('reads each column at its own width', () => {
    strict.deepEqual(
      { ...rows[0] },
      {
        t: Buffer.from([0xff]),
        s: Buffer.from([0x02, 0x01]),
        m: Buffer.from([0x02, 0x00, 0x01, 0x00]),
        i: Buffer.from([0x04, 0x03, 0x02, 0x01]),
        b: Buffer.from([0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
        f: floatBytes,
        d: doubleBytes,
        y: Buffer.from([0xe8, 0x07]),
        n: Buffer.from('3.14'),
        v: Buffer.from('abc'),
        dt: Buffer.from([0xe8, 0x07, 0x01, 0x02]),
        ts: Buffer.from([0xe8, 0x07, 0x01, 0x02, 0x03, 0x04, 0x05]),
        tm: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03]),
        z: null,
      }
    );
  });

  await connection.end();
});
