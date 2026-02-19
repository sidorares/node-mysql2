import type { ResultSetHeader, RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type BigRow = RowDataPacket & { id: string; title: string };

await describe('Insert BigInt Big Number Strings', async () => {
  const connection = createConnection({
    supportBigNumbers: true,
    bigNumberStrings: true,
  });

  connection.query(
    [
      'CREATE TEMPORARY TABLE `bigs` (',
      '`id` bigint NOT NULL AUTO_INCREMENT,',
      '`title` varchar(255),',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );

  await it('should handle bigint with big number strings', async () => {
    connection.query("INSERT INTO bigs SET title='test', id=123");

    const result1 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        "INSERT INTO bigs SET title='test1'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    assert.strictEqual(result1.insertId, 124);

    // > 24 bits
    connection.query("INSERT INTO bigs SET title='test', id=123456789");

    const result2 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        "INSERT INTO bigs SET title='test2'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    assert.strictEqual(result2.insertId, 123456790);

    // big int
    connection.query("INSERT INTO bigs SET title='test', id=9007199254740992");

    const result3 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        "INSERT INTO bigs SET title='test3'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    assert.strictEqual(result3.insertId, '9007199254740993');

    connection.query("INSERT INTO bigs SET title='test', id=90071992547409924");

    const result4 = await new Promise<ResultSetHeader>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        "INSERT INTO bigs SET title='test4'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    assert.strictEqual(result4.insertId, '90071992547409925');

    const selectResult = await new Promise<BigRow[]>((resolve, reject) => {
      connection.query<BigRow[]>('select * from bigs', (err, result) =>
        err ? reject(err) : resolve(result)
      );
    });

    assert.strictEqual(selectResult[0].id, '123');
    assert.strictEqual(selectResult[1].id, '124');
    assert.strictEqual(selectResult[2].id, '123456789');
    assert.strictEqual(selectResult[3].id, '123456790');
    assert.strictEqual(selectResult[4].id, '9007199254740992');
    assert.strictEqual(selectResult[5].id, '9007199254740993');
    assert.strictEqual(selectResult[6].id, '90071992547409924');
    assert.strictEqual(selectResult[7].id, '90071992547409925');
  });

  connection.end();
});
