import type {
  QueryError,
  ResultSetHeader,
  RowDataPacket,
} from '../../../../index.js';
import fs from 'node:fs';
import process from 'node:process';
import { PassThrough } from 'node:stream';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('Load Infile', async () => {
  const connection = createConnection();
  const table = 'load_data_test';

  const [savedLocalInfile] = await connection
    .promise()
    .query<RowDataPacket[]>('SELECT @@GLOBAL.local_infile as backup');
  const originalLocalInfile = savedLocalInfile[0].backup;

  connection.query('SET GLOBAL local_infile = true', assert.ifError);
  connection.query(
    [
      `CREATE TEMPORARY TABLE \`${table}\` (`,
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`title` varchar(255),',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );

  const path = './test/fixtures/data.csv';
  const sql =
    `LOAD DATA LOCAL INFILE ? INTO TABLE ${table} ` +
    `FIELDS TERMINATED BY ? (id, title)`;

  await it('should load data from file and stream', async () => {
    await new Promise<void>((resolve, reject) => {
      let ok: ResultSetHeader;
      let rows: RowDataPacket[];
      let loadErr: QueryError | null = null;
      let loadResult: ResultSetHeader;

      connection.query<ResultSetHeader>(
        {
          sql,
          values: [path, ','],
          infileStreamFactory: () => fs.createReadStream(path),
        },
        (err, _ok) => {
          if (err) return reject(err);
          ok = _ok;
        }
      );

      connection.query<RowDataPacket[]>(
        `SELECT * FROM ${table}`,
        (err, _rows) => {
          if (err) return reject(err);
          rows = _rows;
        }
      );

      // Try to load a file that does not exist to see if we handle this properly
      const badPath = '/does_not_exist.csv';

      connection.query<ResultSetHeader>(sql, [badPath, ','], (err, result) => {
        loadErr = err;
        loadResult = result;
      });

      // test path mapping
      const createMyStream = function () {
        const myStream = new PassThrough();
        setTimeout(() => {
          myStream.write('11,Hello World\n');
          myStream.write('21,One ');
          myStream.write('more row\n');
          myStream.end();
        }, 1000);
        return myStream;
      };

      connection.query<ResultSetHeader>(
        {
          sql: sql,
          values: [badPath, ','],
          infileStreamFactory: createMyStream,
        },
        (err, streamResult) => {
          if (err) return reject(err);

          assert.equal(ok.affectedRows, 4);
          assert.equal(rows.length, 4);
          assert.equal(rows[0].id, 1);
          assert.equal(rows[0].title.trim(), 'Hello World');

          assert(loadErr, 'Expected LOAD DATA error');
          if (!loadErr) {
            return;
          }
          assert.equal(
            loadErr.message,
            `As a result of LOCAL INFILE command server wants to read /does_not_exist.csv file, but as of v2.0 you must provide streamFactory option returning ReadStream.`
          );
          assert.equal(loadResult.affectedRows, 0);

          assert.equal(streamResult.affectedRows, 2);

          connection.query(
            'SET GLOBAL local_infile = ?',
            [originalLocalInfile],
            () => {
              connection.end();
              resolve();
            }
          );
        }
      );
    });
  });
});
