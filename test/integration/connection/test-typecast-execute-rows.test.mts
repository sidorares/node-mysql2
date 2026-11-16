import type { RowDataPacket, TypeCastField } from '../../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type Row = RowDataPacket & { id: unknown; label: unknown; bytes: unknown };

await describe('typeCast on execute reads every row', async () => {
  const connection = createConnection().promise();

  await connection.query(`CREATE TEMPORARY TABLE typecast_rows (
    id INT,
    label VARCHAR(16),
    bytes VARBINARY(16)
  )`);
  await connection.query(
    `INSERT INTO typecast_rows VALUES (1, 'one', X'01'), (2, NULL, NULL), (3, 'three', X'0303')`
  );

  const seen: string[] = [];
  const [rows] = await connection.execute<Row[]>({
    sql: 'SELECT * FROM typecast_rows ORDER BY id',
    typeCast: (field: TypeCastField, next) => {
      seen.push(`${field.name}:${field.type}`);
      if (field.name === 'label') {
        return field.string()?.toUpperCase() ?? 'none';
      }
      if (field.name === 'bytes') {
        return field.buffer()?.toString('hex') ?? 'none';
      }
      return next();
    },
  });

  await it('casts each row from its own values', () => {
    strict.deepEqual(
      rows.map((row) => ({ ...row })),
      [
        { id: 1, label: 'ONE', bytes: '01' },
        { id: 2, label: 'none', bytes: 'none' },
        { id: 3, label: 'THREE', bytes: '0303' },
      ]
    );
  });

  await it('passes each field its metadata', () => {
    strict.deepEqual(seen.slice(0, 3), [
      'id:LONG',
      'label:VAR_STRING',
      'bytes:VAR_STRING',
    ]);
    strict.equal(seen.length, 9);
  });

  await connection.end();
});
