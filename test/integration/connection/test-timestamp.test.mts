import type { FieldPacket, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Timestamp', async () => {
  const connection = createConnection();

  connection.query('SET SQL_MODE="ALLOW_INVALID_DATES";');
  connection.query('CREATE TEMPORARY TABLE t (f TIMESTAMP)');
  connection.query("INSERT INTO t VALUES('0000-00-00 00:00:00')");
  connection.query("INSERT INTO t VALUES('2013-01-22 01:02:03')");

  await it('should handle timestamp values correctly', async () => {
    let rows!: RowDataPacket[];
    let fields!: FieldPacket[];
    let rows1!: RowDataPacket[];
    let fields1!: FieldPacket[];
    let rows2!: RowDataPacket[];

    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        'SELECT f FROM t',
        (err, _rows, _fields) => {
          if (err) return reject(err);
          rows = _rows;
          fields = _fields;
        }
      );
      connection.execute<RowDataPacket[]>(
        'SELECT f FROM t',
        (err, _rows, _fields) => {
          if (err) return reject(err);
          rows1 = _rows;
          fields1 = _fields;
        }
      );

      // test 11-byte timestamp - https://github.com/sidorares/node-mysql2/issues/254
      connection.execute<RowDataPacket[]>(
        'SELECT CURRENT_TIMESTAMP(6) as t11',
        (err, _rows) => {
          if (err) return reject(err);
          rows2 = _rows;
          connection.end();
          resolve();
        }
      );
    });

    strict.deepEqual(rows[0].f.toString(), 'Invalid Date');
    strict(rows[0].f instanceof Date);
    strict(rows[1].f instanceof Date);
    strict.equal(rows[1].f.getYear(), 113);
    strict.equal(rows[1].f.getMonth(), 0);
    strict.equal(rows[1].f.getDate(), 22);
    strict.equal(rows[1].f.getHours(), 1);
    strict.equal(rows[1].f.getMinutes(), 2);
    strict.equal(rows[1].f.getSeconds(), 3);
    strict.equal(fields[0].name, 'f');
    strict.deepEqual(rows[1], rows1[1]);
    // @ts-expect-error: TODO: implement typings
    strict.deepEqual(fields[0].inspect(), fields1[0].inspect());

    strict(rows2[0].t11 instanceof Date);
  });
});
