import type { FieldPacket, RowDataPacket } from '../../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../../common.test.mjs';

type UtfRow = RowDataPacket & Record<string, string>;

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

// 4 bytes in utf8
const pileOfPoo = '💩';

const connection = createConnection({ charset: 'UTF8_GENERAL_CI' });
connection.query<UtfRow[]>(
  'select "💩"',
  (err, rows, fields: FieldPacket[]) => {
    assert.ifError(err);
    assert.equal(fields[0].name, pileOfPoo);
    assert.equal(rows[0][fields[0].name], pileOfPoo);
    connection.end();
  }
);

const connection2 = createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
connection2.query<UtfRow[]>(
  'select "💩"',
  (err, rows, fields: FieldPacket[]) => {
    assert.ifError(err);
    assert.equal(fields[0].name, '?');
    assert.equal(rows[0]['?'], pileOfPoo);
    connection2.end();
  }
);
