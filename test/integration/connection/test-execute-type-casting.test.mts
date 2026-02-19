import type { RowDataPacket } from '../../../index.js';
import { Buffer } from 'node:buffer';
import { assert, test } from 'poku';
import { createConnection, useTestDb } from '../../common.test.mjs';
import typeCastingTests from './type-casting-tests.test.mjs';

type TypeCastTest = {
  type: string;
  insert: string | number | Date | Buffer | null;
  columnType: string;
  expect?: unknown;
  insertRaw?: string;
  deep?: boolean;
  columnName?: string;
};

await test(async () => {
  const connection = createConnection();

  useTestDb();

  await new Promise<void>((resolve, reject) => {
    connection.query('select 1', (err) => (err ? reject(err) : resolve()));
  });

  const tests = (await typeCastingTests(connection)) as TypeCastTest[];

  const table = 'type_casting';

  const schema: string[] = [];
  const inserts: string[] = [];

  tests.forEach((test, index) => {
    const escaped = test.insertRaw || connection.escape(test.insert);

    test.columnName = `${test.type}_${index}`;

    schema.push(`\`${test.columnName}\` ${test.type},`);
    inserts.push(`\`${test.columnName}\` = ${escaped}`);
  });

  const createTable = [
    `CREATE TEMPORARY TABLE \`${table}\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  ]
    .concat(schema)
    .concat(['PRIMARY KEY (`id`)', ') ENGINE=InnoDB DEFAULT CHARSET=utf8'])
    .join('\n');

  connection.query(createTable);

  connection.query(`INSERT INTO ${table} SET${inserts.join(',\n')}`);

  const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
    connection.execute<RowDataPacket[]>(
      `SELECT * FROM ${table} WHERE id = ?;`,
      [1],
      (err, _rows) => (err ? reject(err) : resolve(_rows))
    );
  });

  const row = rows[0];

  tests.forEach((test) => {
    let expected: unknown = test.expect || test.insert;
    let got: unknown = row?.[test.columnName ?? ''];
    let message: string;

    if (expected instanceof Date) {
      assert.equal(got instanceof Date, true, test.type);

      expected = String(expected);
      got = String(got);
    } else if (Buffer.isBuffer(expected)) {
      assert.equal(Buffer.isBuffer(got), true, test.type);

      expected = String(Array.prototype.slice.call(expected));
      got = String(Array.prototype.slice.call(got));
    }

    if (test.deep) {
      message = `got: "${JSON.stringify(got)}" expected: "${JSON.stringify(
        expected
      )}" test: ${test.type}`;
      assert.deepEqual(expected, got, message);
    } else {
      message = `got: "${got}" (${typeof got}) expected: "${expected}" (${typeof expected}) test: ${
        test.type
      }`;
      assert.strictEqual(expected, got, message);
    }
  });

  connection.end();
});
