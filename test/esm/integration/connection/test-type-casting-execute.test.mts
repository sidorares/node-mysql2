import type { FieldPacket, RowDataPacket } from '../../../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert, test } from 'poku';
import driver from '../../../../index.js';
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

const getTypeNameByCode = (
  columnType: number | undefined
): string | undefined => {
  if (columnType === undefined) {
    return undefined;
  }

  for (const [key, value] of Object.entries(driver.Types)) {
    const numericKey = Number(key);
    if (
      !Number.isNaN(numericKey) &&
      numericKey === columnType &&
      typeof value === 'string'
    ) {
      return value;
    }
  }

  return undefined;
};

test(async () => {
  const connection = createConnection();

  useTestDb();

  connection.execute('select 1', async (waitConnectErr) => {
    assert.ifError(waitConnectErr);

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

    connection.execute(createTable);

    connection.execute(`INSERT INTO ${table} SET ${inserts.join(',\n')}`);

    let row: RowDataPacket | undefined;
    let fieldData: Record<string, number | undefined> = {};
    connection.execute<RowDataPacket[]>(
      `SELECT * FROM ${table}`,
      (err, rows, fields) => {
        if (err) {
          throw err;
        }

        row = rows[0];
        // build a fieldName: fieldType lookup table
        fieldData = (fields as FieldPacket[]).reduce(
          (a: Record<string, number | undefined>, v) => {
            a[v['name']] = v['type'];
            return a;
          },
          {}
        );
        connection.end();
      }
    );

    process.on('exit', () => {
      tests.forEach((test) => {
        // check that the column type matches the type name stored in driver.Types
        const columnType = fieldData[test.columnName ?? ''];
        const columnTypeName = getTypeNameByCode(columnType);
        assert.equal(test.columnType === columnTypeName, true, test.columnName);
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
    });
  });
});
