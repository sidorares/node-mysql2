import type { ResultSetHeader, RowDataPacket } from '../../../../index.js';
import Long from 'long';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type BigRow = RowDataPacket & { id: number | string; title: string };

const connection = createConnection();

connection.query(
  [
    'CREATE TEMPORARY TABLE `bigs` (',
    '`id` bigint NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n')
);

connection.query("INSERT INTO bigs SET title='test', id=123");
connection.query<ResultSetHeader>(
  "INSERT INTO bigs SET title='test1'",
  (_err, result) => {
    if (_err) {
      throw _err;
    }
    assert.strictEqual(result.insertId, 124);
    // > 24 bits
    connection.query("INSERT INTO bigs SET title='test', id=123456789");
    connection.query<ResultSetHeader>(
      "INSERT INTO bigs SET title='test2'",
      (_err, result) => {
        assert.strictEqual(result.insertId, 123456790);
        // big int
        connection.query(
          "INSERT INTO bigs SET title='test', id=9007199254740992"
        );
        connection.query<ResultSetHeader>(
          "INSERT INTO bigs SET title='test3'",
          (_err, result) => {
            assert.strictEqual(
              Long.fromString('9007199254740993').compare(result.insertId),
              0
            );
            connection.query(
              "INSERT INTO bigs SET title='test', id=90071992547409924"
            );
            connection.query<ResultSetHeader>(
              "INSERT INTO bigs SET title='test4'",
              (_err, result) => {
                assert.strictEqual(
                  Long.fromString('90071992547409925').compare(result.insertId),
                  0
                );
                connection.query<BigRow[]>(
                  {
                    sql: 'select * from bigs',
                    // @ts-expect-error: supportBigNumbers is not in QueryOptions typings
                    supportBigNumbers: true,
                    bigNumberString: false,
                  },
                  (_err, result) => {
                    assert.strictEqual(result[0].id, 123);
                    assert.strictEqual(result[1].id, 124);
                    assert.strictEqual(result[2].id, 123456789);
                    assert.strictEqual(result[3].id, 123456790);
                    assert.strictEqual(result[4].id, 9007199254740992);
                    assert.strictEqual(result[5].id, '9007199254740993');
                    assert.strictEqual(result[6].id, '90071992547409924');
                    assert.strictEqual(result[7].id, '90071992547409925');
                    connection.end();
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
