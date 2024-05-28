'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

common.useTestDb(connection);

const table = 'nested_test';
connection.query(
  [
    `CREATE TEMPORARY TABLE \`${table}\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n'),
);
connection.query(
  [
    `CREATE TEMPORARY TABLE \`${table}1\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n'),
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
let rows1, rows2, rows3, rows4, rows5, rows1e, rows2e, rows3e;

connection.query(options1, (err, _rows) => {
  if (err) {
    throw err;
  }

  rows1 = _rows;
});

connection.query(options2, (err, _rows) => {
  if (err) {
    throw err;
  }

  rows2 = _rows;
});

connection.query(options3, (err, _rows) => {
  if (err) {
    throw err;
  }

  rows3 = _rows;
});

connection.query(options4, (err, _rows) => {
  if (err) {
    throw err;
  }

  rows4 = _rows;
});

connection.query(options5, (err, _rows) => {
  if (err) {
    throw err;
  }

  rows5 = _rows;
});

connection.execute(options1, (err, _rows) => {
  if (err) {
    throw err;
  }

  rows1e = _rows;
});

connection.execute(options2, (err, _rows) => {
  if (err) {
    throw err;
  }

  rows2e = _rows;
});

connection.execute(options3, (err, _rows) => {
  if (err) {
    throw err;
  }

  rows3e = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.equal(rows1.length, 1);
  assert.equal(rows1[0].nested_test.id, 1);
  assert.equal(rows1[0].nested_test.title, 'test');
  assert.equal(rows2.length, 1);
  assert.equal(rows2[0].nested_test_id, 1);
  assert.equal(rows2[0].nested_test_title, 'test');

  assert.equal(Array.isArray(rows3[0]), true);
  assert.equal(rows3[0][0], 1);
  assert.equal(rows3[0][1], 'test');

  assert.equal(rows4.length, 1);
  assert.deepEqual(rows4[0], {
    nested: {
      title: 'test1',
    },
    notNested: {
      id: 1,
      title: 'test',
    },
  });
  assert.equal(rows5.length, 1);
  assert.deepEqual(rows5[0], {
    nested2: {
      title: 'test1',
    },
    notNested: {
      id: 1,
      title: 'test',
    },
  });

  assert.deepEqual(rows1, rows1e);
  assert.deepEqual(rows2, rows2e);
  assert.deepEqual(rows3, rows3e);
});
