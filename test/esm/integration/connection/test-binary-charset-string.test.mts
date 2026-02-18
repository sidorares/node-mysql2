import type { FieldPacket, RowDataPacket } from '../../../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

// TODO - this could be re-enabled
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('Binary Charset String', async () => {
  const connection = createConnection();

  await it('should return correct charset strings for query and execute', async () => {
    let rows: RowDataPacket[] | undefined;
    let fields: FieldPacket[] | undefined;
    let rows1: RowDataPacket[] | undefined;
    let fields1: FieldPacket[] | undefined;
    let rows2: RowDataPacket[] | undefined;
    let fields2: FieldPacket[] | undefined;
    let rows3: RowDataPacket[] | undefined;
    let fields3: FieldPacket[] | undefined;
    let rows4: RowDataPacket[] | undefined;
    let fields4: FieldPacket[] | undefined;
    let rows5: RowDataPacket[] | undefined;
    let fields5: FieldPacket[] | undefined;

    const query = "SELECT x'010203'";
    const query1 = "SELECT '010203'";

    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(query, (err, _rows, _fields) => {
        if (err) return reject(err);
        rows = _rows;
        fields = _fields;
      });

      connection.query<RowDataPacket[]>(query, (err, _rows, _fields) => {
        if (err) return reject(err);
        rows5 = _rows;
        fields5 = _fields;
      });

      connection.query<RowDataPacket[]>(query1, (err, _rows, _fields) => {
        if (err) return reject(err);
        rows1 = _rows;
        fields1 = _fields;
      });

      connection.execute<RowDataPacket[]>(query, [], (err, _rows, _fields) => {
        if (err) return reject(err);
        rows2 = _rows;
        fields2 = _fields;
      });

      // repeat same query - test cached fields and parser
      connection.execute<RowDataPacket[]>(query, [], (err, _rows, _fields) => {
        if (err) return reject(err);
        rows4 = _rows;
        fields4 = _fields;
      });

      connection.execute<RowDataPacket[]>(query1, [], (err, _rows, _fields) => {
        if (err) return reject(err);
        rows3 = _rows;
        fields3 = _fields;
        connection.end();
        resolve();
      });
    });

    assert.deepEqual(rows, [{ "x'010203'": Buffer.from([1, 2, 3]) }]);
    assert.equal(fields?.[0].name, "x'010203'");
    assert.deepEqual(rows1, [{ '010203': '010203' }]);
    assert.equal(fields1?.[0].name, '010203');
    assert.deepEqual(rows2, [{ "x'010203'": Buffer.from([1, 2, 3]) }]);
    assert.equal(fields2?.[0].name, "x'010203'");
    assert.deepEqual(rows3, [{ '010203': '010203' }]);
    assert.equal(fields3?.[0].name, '010203');

    assert.deepEqual(rows4, [{ "x'010203'": Buffer.from([1, 2, 3]) }]);
    assert.equal(fields4?.[0].name, "x'010203'");
    assert.deepEqual(rows5, [{ "x'010203'": Buffer.from([1, 2, 3]) }]);
    assert.equal(fields5?.[0].name, "x'010203'");
  });
});
