import type { RowDataPacket, TypeCastField } from '../../../promise.js';
import { describe, it, skip, strict } from 'poku';
import { config, createConnection } from '../../common.test.mjs';

if (config.disableEval) {
  skip(
    'The static parsers let a query typeCast of true replace the connection one'
  );
}

type Row = RowDataPacket & { label: unknown };

await describe('typeCast set on the connection, with typeCast: true on the query', async () => {
  const connection = createConnection({
    typeCast: (field: TypeCastField, next) =>
      field.name === 'label' ? `${field.string()}!` : next(),
  }).promise();
  const sql = "SELECT 'one' AS label";

  for (const method of ['query', 'execute'] as const) {
    await it(`${method} applies it on a cached parser too`, async () => {
      for (let i = 0; i < 2; i++) {
        const [rows] =
          method === 'query'
            ? await connection.query<Row[]>({ sql, typeCast: true })
            : await connection.execute<Row[]>({ sql, typeCast: true });

        strict.equal(rows[0].label, 'one!');
      }
    });
  }

  await connection.end();
});
