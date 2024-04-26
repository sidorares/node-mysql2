'use strict';

const { assert } = require('poku');
const { createConnection } = require('../common.test.cjs');

(async () => {
  const conn = createConnection({ multipleStatements: true });
  const captured1 = [];
  const captured2 = [];
  const sql1 =
    'select * from information_schema.columns order by table_schema, table_name, column_name limit 1;';
  const sql2 =
    'select * from information_schema.columns order by table_schema, table_name, ordinal_position limit 1;';

  await conn.promise().query('set global max_allowed_packet=524288000');

  const compare1 = await conn.promise().query(sql1);
  const compare2 = await conn.promise().query(sql2);

  if (!compare1 || compare1.length < 1) {
    assert.fail('no results for comparison 1');
  }
  if (!compare2 || compare2.length < 1) {
    assert.fail('no results for comparison 2');
  }

  const stream = conn.query(`${sql1}\n${sql2}`).stream();
  stream.on('result', (row, datasetIndex) => {
    if (datasetIndex === 0) {
      captured1.push(row);
    } else {
      captured2.push(row);
    }
  });
  // note: this is very important:
  // after each result set is complete,
  // the stream will emit "readable" and if we don't
  // read then 'end' won't be emitted and the
  // test will hang.
  stream.on('readable', () => {
    stream.read();
  });

  await new Promise((resolve, reject) => {
    stream.on('error', (e) => reject(e));
    stream.on('end', () => resolve());
  });

  assert.equal(captured1.length, 1);
  assert.equal(captured2.length, 1);
  assert.deepEqual(captured1[0], compare1[0][0]);
  assert.deepEqual(captured2[0], compare2[0][0]);

  conn.end();
})();
