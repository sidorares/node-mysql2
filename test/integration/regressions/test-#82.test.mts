import type { QueryError, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Regression #82', async () => {
  await it('should correctly query views built on views', async () => {
    const connection = createConnection();

    const config = {
      table1: 'test82t1',
      table2: 'test82t2',
      view1: 'view82v1',
      view2: 'view82v2',
    };

    const prepareTestSet = function (cb: (err: QueryError | null) => void) {
      connection.query(`drop table if exists ${config.table1}`);
      connection.query(`drop table if exists ${config.table2}`);
      connection.query(`drop view if exists ${config.view1}`);
      connection.query(`drop view if exists ${config.view2}`);
      connection.query(
        `create table ${config.table1} (name1 varchar(20), linkId1 integer(11))`
      );
      connection.query(
        `create table ${config.table2} (name2 varchar(20), linkId2 integer(11))`
      );
      connection.query(
        `insert into ${config.table1} (name1, linkId1) values ("A", 1),("B", 2),("C", 3),("D", 4)`
      );
      connection.query(
        `insert into ${config.table2} (name2, linkId2) values ("AA", 1),("BB", 2),("CC", 3),("DD", 4)`
      );
      connection.query(
        `create view ${config.view1} as select name1, linkId1, name2 from ${config.table1} INNER JOIN ${config.table2} ON linkId1 = linkId2`
      );
      connection.query(
        `create view ${config.view2} as select name1, name2 from ${config.view1}`,
        cb
      );
    };

    const results = await new Promise<RowDataPacket[]>((resolve, reject) => {
      prepareTestSet((err) => {
        if (err) return reject(err);
        connection.query<RowDataPacket[]>(
          `select * from ${config.view2} order by name2 desc`,
          (err, rows) => {
            if (err) return reject(err);
            connection.end(() => resolve(rows));
          }
        );
      });
    });

    strict.equal(results[0].name1, 'D');
    strict.equal(results[1].name1, 'C');
    strict.equal(results[2].name1, 'B');
    strict.equal(results[3].name1, 'A');
    strict.equal(results[0].name2, 'DD');
    strict.equal(results[1].name2, 'CC');
    strict.equal(results[2].name2, 'BB');
    strict.equal(results[3].name2, 'AA');
  });
});
