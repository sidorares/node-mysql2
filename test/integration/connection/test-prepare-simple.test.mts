import type { PrepareStatementInfo } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Prepare Simple', async () => {
  const connection = createConnection();

  const query1 = 'select 1 + ? + ? as test';
  const query2 = 'select 1 + 1'; // no parameters
  const query3 = 'create temporary table aaa(i int);'; // no parameters, no result columns

  await it('should prepare statements with varying parameters', async () => {
    const stmt1 = await new Promise<PrepareStatementInfo>((resolve, reject) => {
      connection.prepare(query1, (err, stmt) => {
        if (err) return reject(err);
        resolve(stmt);
      });
    });

    stmt1.close();

    await new Promise<void>((resolve, reject) => {
      connection.prepare(query2, (err2, stmt2) => {
        if (err2) return reject(err2);
        connection.prepare(query3, (err3, stmt3) => {
          if (err3) return reject(err3);
          stmt2.close();
          stmt3.close();
          connection.end();
          resolve();
        });
      });
    });

    strict(stmt1, 'Expected prepared statement');
    // @ts-expect-error: TODO: implement typings
    strict.equal(stmt1.query, query1);
    // @ts-expect-error: TODO: implement typings
    strict(stmt1.id >= 0);
    // @ts-expect-error: TODO: implement typings
    strict.equal(stmt1.columns.length, 1);
    // @ts-expect-error: TODO: implement typings
    strict.equal(stmt1.parameters.length, 2);
  });
});
