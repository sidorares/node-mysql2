import type { RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection, useTestDb } from '../../common.test.mjs';

await describe('Nested Tables Query', async () => {
  const connection = createConnection();

  useTestDb();

  const table = 'nested_test';
  connection.query(
    [
      `CREATE TEMPORARY TABLE \`${table}\` (`,
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`title` varchar(255),',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );
  connection.query(
    [
      `CREATE TEMPORARY TABLE \`${table}1\` (`,
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`title` varchar(255),',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );

  connection.query(`INSERT INTO ${table} SET ?`, { title: 'test' });
  connection.query(`INSERT INTO ${table}1 SET ?`, { title: 'test1' });

  const options1 = {
    nestTables: true,
    sql: `SELECT * FROM ${table}`,
  };
  const options2 = {
    nestTables: '_',
    sql: `SELECT * FROM ${table}`,
  };
  const options3 = {
    rowsAsArray: true,
    sql: `SELECT * FROM ${table}`,
  };
  const options4 = {
    nestTables: true,
    sql: `SELECT notNested.id, notNested.title, nested.title FROM ${table} notNested LEFT JOIN ${table}1 nested ON notNested.id = nested.id`,
  };
  const options5 = {
    nestTables: true,
    sql: `SELECT notNested.id, notNested.title, nested2.title FROM ${table} notNested LEFT JOIN ${table}1 nested2 ON notNested.id = nested2.id`,
  };

  await it('should handle nested tables and row formats', async () => {
    const results = await new Promise<{
      rows1: RowDataPacket[];
      rows2: RowDataPacket[];
      rows3: RowDataPacket[];
      rows4: RowDataPacket[];
      rows5: RowDataPacket[];
      rows1e: RowDataPacket[];
      rows2e: RowDataPacket[];
      rows3e: RowDataPacket[];
    }>((resolve, reject) => {
      let rows1: RowDataPacket[];
      let rows2: RowDataPacket[];
      let rows3: RowDataPacket[];
      let rows4: RowDataPacket[];
      let rows5: RowDataPacket[];
      let rows1e: RowDataPacket[];
      let rows2e: RowDataPacket[];

      connection.query<RowDataPacket[]>(options1, (err, _rows) => {
        if (err) return reject(err);
        rows1 = _rows;
      });

      connection.query<RowDataPacket[]>(options2, (err, _rows) => {
        if (err) return reject(err);
        rows2 = _rows;
      });

      connection.query<RowDataPacket[]>(options3, (err, _rows) => {
        if (err) return reject(err);
        rows3 = _rows;
      });

      connection.query<RowDataPacket[]>(options4, (err, _rows) => {
        if (err) return reject(err);
        rows4 = _rows;
      });

      connection.query<RowDataPacket[]>(options5, (err, _rows) => {
        if (err) return reject(err);
        rows5 = _rows;
      });

      connection.execute<RowDataPacket[]>(options1, (err, _rows) => {
        if (err) return reject(err);
        rows1e = _rows;
      });

      connection.execute<RowDataPacket[]>(options2, (err, _rows) => {
        if (err) return reject(err);
        rows2e = _rows;
      });

      connection.execute<RowDataPacket[]>(options3, (err, _rows) => {
        if (err) return reject(err);
        resolve({
          rows1,
          rows2,
          rows3,
          rows4,
          rows5,
          rows1e,
          rows2e,
          rows3e: _rows,
        });
      });
    });

    assert.equal(results.rows1.length, 1, 'First row length');
    assert.equal(results.rows1[0].nested_test.id, 1, 'First row nested id');
    assert.equal(
      results.rows1[0].nested_test.title,
      'test',
      'First row nested title'
    );
    assert.equal(results.rows2.length, 1, 'Second row length');
    assert.equal(results.rows2[0].nested_test_id, 1, 'Second row nested id');
    assert.equal(
      results.rows2[0].nested_test_title,
      'test',
      'Second row nested title'
    );

    assert.equal(Array.isArray(results.rows3[0]), true, 'Third row type');
    assert.equal(results.rows3[0][0], 1, 'Third row value 1');
    assert.equal(results.rows3[0][1], 'test', 'Third row value 2');

    assert.equal(results.rows4.length, 1, 'Fourth row length');
    assert.deepEqual(
      results.rows4[0],
      {
        nested: {
          title: 'test1',
        },
        notNested: {
          id: 1,
          title: 'test',
        },
      },
      'Fourth row value'
    );
    assert.equal(results.rows5.length, 1, 'Fifth row length');
    assert.deepEqual(
      results.rows5[0],
      {
        nested2: {
          title: 'test1',
        },
        notNested: {
          id: 1,
          title: 'test',
        },
      },
      'Fifth row value'
    );

    assert.deepEqual(
      results.rows1,
      results.rows1e,
      'Compare rows1 with rows1e'
    );
    assert.deepEqual(
      results.rows2,
      results.rows2e,
      'Compare rows2 with rows2e'
    );
    assert.deepEqual(
      results.rows3,
      results.rows3e,
      'Compare rows3 with rows3e'
    );
  });

  connection.end();
});
