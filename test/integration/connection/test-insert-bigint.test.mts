import type { ResultSetHeader, RowDataPacket } from '../../../index.js';
import Long from 'long';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type BigRow = RowDataPacket & { id: number | string; title: string };

await describe('Insert BigInt', async () => {
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

  await it('should handle bigint insert IDs', async () => {
    connection.query("INSERT INTO bigs SET title='test', id=123");

    const result1 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        "INSERT INTO bigs SET title='test1'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    strict.strictEqual(result1.insertId, 124);

    // > 24 bits
    connection.query("INSERT INTO bigs SET title='test', id=123456789");

    const result2 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        "INSERT INTO bigs SET title='test2'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    strict.strictEqual(result2.insertId, 123456790);

    // big int
    connection.query("INSERT INTO bigs SET title='test', id=9007199254740992");

    const result3 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        "INSERT INTO bigs SET title='test3'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    strict.strictEqual(
      Long.fromString('9007199254740993').compare(result3.insertId),
      0
    );

    connection.query("INSERT INTO bigs SET title='test', id=90071992547409924");

    const result4 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        "INSERT INTO bigs SET title='test4'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    strict.strictEqual(
      Long.fromString('90071992547409925').compare(result4.insertId),
      0
    );

    const selectResult = await new Promise<BigRow[]>((resolve, reject) => {
      connection.query<BigRow[]>(
        {
          sql: 'select * from bigs',
          // @ts-expect-error: supportBigNumbers is not in QueryOptions typings
          supportBigNumbers: true,
          bigNumberString: false,
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    strict.strictEqual(selectResult[0].id, 123);
    strict.strictEqual(selectResult[1].id, 124);
    strict.strictEqual(selectResult[2].id, 123456789);
    strict.strictEqual(selectResult[3].id, 123456790);
    strict.strictEqual(selectResult[4].id, 9007199254740992);
    strict.strictEqual(selectResult[5].id, '9007199254740993');
    strict.strictEqual(selectResult[6].id, '90071992547409924');
    strict.strictEqual(selectResult[7].id, '90071992547409925');
  });

  connection.end();
});
