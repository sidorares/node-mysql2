'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

const config = {
  table1: 'test82t1',
  table2: 'test82t2',
  view1: 'view82v1',
  view2: 'view82v2',
};
let results = null;

const prepareTestSet = function (cb) {
  connection.query(`drop table if exists ${config.table1}`);
  connection.query(`drop table if exists ${config.table2}`);
  connection.query(`drop view if exists ${config.view1}`);
  connection.query(`drop view if exists ${config.view2}`);
  connection.query(
    `create table ${config.table1} (name1 varchar(20), linkId1 integer(11))`,
  );
  connection.query(
    `create table ${config.table2} (name2 varchar(20), linkId2 integer(11))`,
  );
  connection.query(
    `insert into ${config.table1} (name1, linkId1) values ("A", 1),("B", 2),("C", 3),("D", 4)`,
  );
  connection.query(
    `insert into ${config.table2} (name2, linkId2) values ("AA", 1),("BB", 2),("CC", 3),("DD", 4)`,
  );
  connection.query(
    `create view ${config.view1} as select name1, linkId1, name2 from ${config.table1} INNER JOIN ${config.table2} ON linkId1 = linkId2`,
  );
  connection.query(
    `create view ${config.view2} as select name1, name2 from ${config.view1}`,
    cb,
  );
};

prepareTestSet((err) => {
  assert.ifError(err);
  connection.query(
    `select * from ${config.view2} order by name2 desc`,
    (err, rows) => {
      assert.ifError(err);
      results = rows;
      connection.end();
    },
  );
});

process.on('exit', () => {
  assert.equal(results[0].name1, 'D');
  assert.equal(results[1].name1, 'C');
  assert.equal(results[2].name1, 'B');
  assert.equal(results[3].name1, 'A');
  assert.equal(results[0].name2, 'DD');
  assert.equal(results[1].name2, 'CC');
  assert.equal(results[2].name2, 'BB');
  assert.equal(results[3].name2, 'AA');
});
