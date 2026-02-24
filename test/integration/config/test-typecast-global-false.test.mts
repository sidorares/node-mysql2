import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Typecast Global False', async () => {
  const connection = createConnection({
    typeCast: false,
  });

  const COL_1_VALUE = 'col v1';
  const COL_2_VALUE = 'col v2';

  function executeTests(res: RowDataPacket[]) {
    strict.equal(res[0].v1.toString('ascii'), COL_1_VALUE);
    strict.equal(res[0].n1, null);
    strict.equal(res[0].v2.toString('ascii'), COL_2_VALUE);
  }

  connection.query(
    'CREATE TEMPORARY TABLE binpar_null_test (v1 VARCHAR(16) NOT NULL, n1 VARCHAR(16), v2 VARCHAR(16) NOT NULL)'
  );
  connection.query(
    `INSERT INTO binpar_null_test (v1, n1, v2) VALUES ("${COL_1_VALUE}", NULL, "${COL_2_VALUE}")`,
    (err) => {
      if (err) throw err;
    }
  );

  await it('should return raw buffers when typeCast is false', async () => {
    const res = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute(
        'SELECT * FROM binpar_null_test',
        (err, _res: RowDataPacket[]) => (err ? reject(err) : resolve(_res))
      );
    });

    executeTests(res);
  });

  connection.end();
});
