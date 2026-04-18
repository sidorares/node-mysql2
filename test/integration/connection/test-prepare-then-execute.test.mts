import type {
  FieldPacket,
  PrepareStatementInfo,
  RowDataPacket,
} from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Prepare Then Execute', async () => {
  const connection = createConnection();

  await it('should prepare and then execute a statement', async () => {
    const { stmt, columns, rows } = await new Promise<{
      stmt: PrepareStatementInfo;
      columns: FieldPacket[];
      rows: RowDataPacket[];
    }>((resolve, reject) => {
      connection.prepare('select 1 + ? + ? as test', (err, stmt) => {
        if (err) return reject(err);
        stmt.execute<RowDataPacket[]>([111, 123], (err, rows, columns) => {
          if (err) return reject(err);
          resolve({ stmt, columns, rows });
        });
      });
    });

    strict(stmt, 'Expected prepared statement');
    strict(columns, 'Expected statement metadata');
    // @ts-expect-error: TODO: implement typings
    strict.equal(stmt.columns.length, 1);
    // @ts-expect-error: TODO: implement typings
    strict.equal(stmt.parameters.length, 2);
    strict.deepEqual(rows, [{ test: 235 }]);
    strict.equal(columns[0].name, 'test');
  });

  connection.end();
});
