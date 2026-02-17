import type { FieldPacket, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnectionWithURI } from '../../common.test.mjs';

if (process.env.MYSQL_CONNECTION_URL) {
  console.log(
    'skipping test when mysql server is configured using MYSQL_CONNECTION_URL'
  );
  process.exit(0);
}

const connection = createConnectionWithURI();

let rows: RowDataPacket[] | undefined = undefined;
let fields: FieldPacket[] | undefined = undefined;
connection.query<RowDataPacket[]>('SELECT 1', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }

  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ 1: 1 }]);
  assert.equal(fields?.[0].name, '1');
});
