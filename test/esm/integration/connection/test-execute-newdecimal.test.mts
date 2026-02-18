import type { FieldPacket, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

connection.query('CREATE TEMPORARY TABLE t (f DECIMAL(19,4))');
connection.query('INSERT INTO t VALUES(12345.67)');

let rows: RowDataPacket[], fields: FieldPacket[];
connection.execute<RowDataPacket[]>(
  'SELECT f FROM t',
  (err, _rows, _fields) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    fields = _fields;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ f: '12345.6700' }]);
  assert.equal(fields[0].name, 'f');
});
