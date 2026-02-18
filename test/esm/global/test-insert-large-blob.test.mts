import type { ResultSetHeader, RowDataPacket } from '../../../index.js';
import { Buffer } from 'node:buffer';
import { assert, describe, it } from 'poku';
import { createConnection } from '../common.test.mjs';

type BlobRow = RowDataPacket & { id: number; content: Buffer };

// intentionally disabled
const _disabled = false;

if (_disabled) {
  await describe('Insert Large Blob', async () => {
    const connection = createConnection();

    /*
    connection.query('SELECT repeat("a", 60000000) as qqq', function (err, res) {
      console.log(err);
      console.log(err, res[0].qqq.length);
      connection.end();
    });
    return;
  */

    const table = 'insert_large_test';
    const length = 35777416;
    const content = Buffer.allocUnsafe(length); // > 16 megabytes
    const content1 = Buffer.allocUnsafe(length); // > 16 megabytes

    // this is to force compressed packed to be larger than uncompressed
    for (let i = 0; i < content.length; ++i) {
      content[i] = Math.floor(Math.random() * 256);
      content1[i] = Math.floor(Math.random() * 256);

      // low entropy version, compressed < uncompressed
      if (i < length / 2) {
        content1[i] = 100;
      }
    }

    await it('should insert and retrieve large blobs', async () => {
      await new Promise<void>((resolve, reject) => {
        connection.query(
          `SET GLOBAL max_allowed_packet=${length * 2 + 2000}`,
          (err) => {
            if (err) return reject(err);
            connection.end();
            const connection2 = createConnection();
            connection2.query(
              [
                `CREATE TEMPORARY TABLE \`${table}\` (`,
                '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
                '`content` longblob NOT NULL,',
                'PRIMARY KEY (`id`)',
                ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
              ].join('\n')
            );
            connection2.query<ResultSetHeader>(
              `INSERT INTO ${table} (content) VALUES(?)`,
              [content],
              (err, result) => {
                if (err) return reject(err);
                connection2.query<BlobRow[]>(
                  `SELECT * FROM ${table} WHERE id = ${result.insertId}`,
                  (_err, result2) => {
                    if (_err) return reject(_err);

                    assert.equal(result2[0].id, String(result.insertId));
                    assert.equal(
                      result2[0].content.toString('hex'),
                      content.toString('hex')
                    );

                    connection2.query<ResultSetHeader>(
                      `INSERT INTO ${table} (content) VALUES(?)`,
                      [content1],
                      (err, result3) => {
                        if (err) return reject(err);
                        connection2.query<BlobRow[]>(
                          `SELECT * FROM ${table} WHERE id = ${result3.insertId}`,
                          (err, result4) => {
                            if (err) return reject(err);
                            assert.equal(
                              result4[0].content.toString('hex'),
                              content1.toString('hex')
                            );
                            connection2.end();
                            resolve();
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  });
}
