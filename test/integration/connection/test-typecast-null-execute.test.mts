import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

// Regression for #3368: in the binary protocol (execute), NULL columns were
// short-circuited to `null` before the user typeCast ran, so typeCast was
// never called for them -- unlike the text protocol (query). These tests
// assert typeCast now sees NULL columns and can override them, without
// desyncing the packet reader for the surrounding columns.
await describe('Typecast NULL Execute (#3368)', async () => {
  const connection = createConnection();

  await it('calls typeCast for a NULL column and lets it override the value', async () => {
    const seen: Array<string | null> = [];

    const res = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        {
          sql: 'SELECT NULL AS foo',
          typeCast(field, next) {
            const value = field.string();
            seen.push(value);
            if (value === null) {
              return '<was-null>';
            }
            return next();
          },
        },
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    strict.deepEqual(seen, [null], 'typeCast ran for the NULL column');
    strict.equal(res[0].foo, '<was-null>', 'and its return value was used');
  });

  await it('a passthrough typeCast still yields null and preserves column alignment', async () => {
    const names: string[] = [];

    const res = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        {
          sql: "SELECT 1 AS a, NULL AS b, 'z' AS c",
          typeCast(field, next) {
            names.push(field.name);
            return next();
          },
        },
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    strict.deepEqual(names, ['a', 'b', 'c'], 'every column, NULL included');
    strict.equal(res[0].a, 1);
    strict.equal(res[0].b, null, 'passthrough of NULL stays null');
    strict.equal(res[0].c, 'z', 'column after the NULL is still aligned');
  });

  connection.end();
});
