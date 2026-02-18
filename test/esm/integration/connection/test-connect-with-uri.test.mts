import type { FieldPacket, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnectionWithURI } from '../../common.test.mjs';

if (process.env.MYSQL_CONNECTION_URL) {
  console.log(
    'skipping test when mysql server is configured using MYSQL_CONNECTION_URL'
  );
  process.exit(0);
}

await describe('Connect With URI', async () => {
  const connection = createConnectionWithURI();

  await it('should connect and query using URI', async () => {
    let rows: RowDataPacket[] | undefined;
    let fields: FieldPacket[] | undefined;

    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT 1', (err, _rows, _fields) => {
        if (err) return reject(err);
        rows = _rows;
        fields = _fields;
        connection.end();
        resolve();
      });
    });

    assert.deepEqual(rows, [{ 1: 1 }]);
    assert.equal(fields?.[0].name, '1');
  });
});
