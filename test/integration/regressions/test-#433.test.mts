import type { QueryError, RowDataPacket } from '../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('PlanetScale: charset support unclear (TODO: clarify)');
}

await describe('Regression #433', async () => {
  await it('should correctly handle KOI8R charset in table names and error messages', async () => {
    const connection = createConnection({ charset: 'KOI8R_GENERAL_CI' });

    const tableName = 'МояТаблица';
    const testFields = ['поле1', 'поле2', 'поле3', 'поле4'];
    const testRows = [
      ['привет', 'мир', 47, 7],
      ['ура', 'тест', 11, 108],
    ];

    const { actualRows, actualError } = await new Promise<{
      actualRows: RowDataPacket[];
      actualError: string;
    }>((resolve, reject) => {
      connection.query(
        [
          `CREATE TEMPORARY TABLE \`${tableName}\` (`,
          ` \`${testFields[0]}\` varchar(255) NOT NULL,`,
          ` \`${testFields[1]}\` varchar(255) NOT NULL,`,
          ` \`${testFields[2]}\` int(11) NOT NULL,`,
          ` \`${testFields[3]}\` int(11) NOT NULL,`,
          ` PRIMARY KEY (\`${testFields[0]}\`)`,
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
        ].join(' '),
        (err: QueryError | null) => {
          if (err) return reject(err);
          connection.query(
            [
              `INSERT INTO \`${tableName}\` VALUES`,
              `("${testRows[0][0]}","${testRows[0][1]}", ${testRows[0][2]}, ${testRows[0][3]}),`,
              `("${testRows[1][0]}","${testRows[1][1]}", ${testRows[1][2]}, ${testRows[1][3]})`,
            ].join(' '),
            (err: QueryError | null) => {
              if (err) return reject(err);
              connection.query<RowDataPacket[]>(
                `SELECT * FROM \`${tableName}\``,
                (err, rows) => {
                  if (err) return reject(err);
                  connection.query(`SELECT * FROM \`${tableName}`, (err) => {
                    if (!err) {
                      return reject(new Error('Expected query to fail'));
                    }
                    connection.end(() =>
                      resolve({ actualRows: rows, actualError: err.message })
                    );
                  });
                }
              );
            }
          );
        }
      );
    });

    testRows.map((tRow, index) => {
      const cols = testFields;
      const aRow = actualRows[index];
      strict.equal(aRow[cols[0]], tRow[0]);
      strict.equal(aRow[cols[1]], tRow[1]);
      strict.equal(aRow[cols[2]], tRow[2]);
      strict.equal(aRow[cols[3]], tRow[3]);
    });

    /* eslint quotes: 0 */
    const expectedErrorMysql =
      "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '`МояТаблица' at line 1";

    const expectedErrorMariaDB =
      "You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '`МояТаблица' at line 1";

    // @ts-expect-error: internal access
    if (connection._handshakePacket.serverVersion.match(/MariaDB/)) {
      strict.equal(actualError, expectedErrorMariaDB);
    } else {
      strict.equal(actualError, expectedErrorMysql);
    }
  });
});
