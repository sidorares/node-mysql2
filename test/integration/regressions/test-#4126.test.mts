import type { ResultSetHeader, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection, createPool } from '../../common.test.mjs';

type DomainRow = RowDataPacket & { id: number; domain: string };
type DocRow = RowDataPacket & { id: number; foo: string; hasModified: number };

await describe('Regression #4126 — object placeholders expand in SET assignment lists', async () => {
  await describe('client-side formatting', async () => {
    const connection = createConnection();

    it('should expand ?? and ? object inside SET STATEMENT ... FOR INSERT', () => {
      strict.equal(
        connection.format(
          'SET STATEMENT max_statement_time=15 FOR INSERT INTO ?? SET ?',
          ['domains', { id: 1, domain: 'test.com' }]
        ),
        "SET STATEMENT max_statement_time=15 FOR INSERT INTO `domains` SET `id` = 1, `domain` = 'test.com'"
      );
    });

    it('should expand ? object after UTC_TIMESTAMP() in an UPDATE SET list', () => {
      strict.equal(
        connection.format(
          'UPDATE docs SET modified = UTC_TIMESTAMP(), ? WHERE id = ?',
          [{ foo: 'bar' }, 123]
        ),
        "UPDATE docs SET modified = UTC_TIMESTAMP(), `foo` = 'bar' WHERE id = 123"
      );
    });

    connection.end();
  });

  await describe('end-to-end execution', async () => {
    const pool = createPool({ connectionLimit: 1 }).promise();

    await it('should insert via object-form query with ??, ? object and timeout', async () => {
      await pool.query(
        'CREATE TEMPORARY TABLE domains (id INT PRIMARY KEY, domain VARCHAR(255))'
      );

      const [result] = await pool.query<ResultSetHeader>({
        sql: 'INSERT INTO ?? SET ?',
        values: ['domains', { id: 1, domain: 'test.com' }],
        timeout: 16000,
      });

      strict.equal(result.affectedRows, 1);

      const [rows] = await pool.query<DomainRow[]>(
        'SELECT id, domain FROM domains'
      );
      strict.equal(rows.length, 1);
      strict.equal(rows[0].id, 1);
      strict.equal(rows[0].domain, 'test.com');
    });

    await it('should update via ? object mixed with UTC_TIMESTAMP()', async () => {
      await pool.query(
        'CREATE TEMPORARY TABLE docs (id INT PRIMARY KEY, foo VARCHAR(50), modified DATETIME)'
      );
      await pool.query('INSERT INTO docs (id, foo) VALUES (123, ?)', ['old']);

      const [result] = await pool.query<ResultSetHeader>(
        'UPDATE docs SET modified = UTC_TIMESTAMP(), ? WHERE id = ?',
        [{ foo: 'bar' }, 123]
      );

      strict.equal(result.affectedRows, 1);

      const [rows] = await pool.query<DocRow[]>(
        'SELECT id, foo, modified IS NOT NULL AS hasModified FROM docs'
      );

      strict.equal(rows.length, 1);
      strict.equal(rows[0].foo, 'bar');
      strict.equal(rows[0].hasModified, 1);
    });

    await pool.end();
  });
});
