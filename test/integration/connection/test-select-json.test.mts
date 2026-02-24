/**
 * Created by Alexander Panko <god@panki.ru> on 2016.09.23 18:02
 * issue#409: https://github.com/sidorares/node-mysql2/issues/409
 */
import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Select JSON', async () => {
  await it('should select JSON values correctly via text and binary protocol', async () => {
    const connection = createConnection();

    let textFetchedRows: RowDataPacket[];
    let binaryFetchedRows: RowDataPacket[];

    const face = '\uD83D\uDE02';

    connection.query('CREATE TEMPORARY TABLE json_test (json_test JSON)');
    connection.query('INSERT INTO json_test VALUES (?)', JSON.stringify(face));

    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        'SELECT * FROM json_test',
        (err, _rows) => {
          if (err) return reject(err);
          textFetchedRows = _rows;
          connection.execute<RowDataPacket[]>(
            'SELECT * FROM json_test',
            (err, _rows) => {
              if (err) return reject(err);
              binaryFetchedRows = _rows;
              connection.end();
              resolve();
            }
          );
        }
      );
    });

    strict.equal(textFetchedRows![0].json_test, face);
    strict.equal(binaryFetchedRows![0].json_test, face);
  });
});
