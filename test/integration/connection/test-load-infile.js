'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');
const fs = require('fs');

const table = 'load_data_test';
connection.query('SET GLOBAL local_infile = true', assert.ifError);
connection.query(
  [
    `CREATE TEMPORARY TABLE \`${table}\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join('\n')
);

const path = './test/fixtures/data.csv';
const sql =
  `LOAD DATA LOCAL INFILE ? INTO TABLE ${table} ` +
  `FIELDS TERMINATED BY ? (id, title)`;

let ok;
connection.query(
  {
    sql,
    values: [path, ','],
    infileStreamFactory: () => fs.createReadStream(path)
  },
  (err, _ok) => {
    if (err) {
      throw err;
    }
    ok = _ok;
  }
);

let rows;
connection.query(`SELECT * FROM ${table}`, (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
});

// Try to load a file that does not exist to see if we handle this properly
let loadErr;
let loadResult;
const badPath = '/does_not_exist.csv';

connection.query(sql, [badPath, ','], (err, result) => {
  loadErr = err;
  loadResult = result;
});

// test path mapping
const createMyStream = function() {
  const Stream = require('stream').PassThrough;
  const myStream = new Stream();
  setTimeout(() => {
    myStream.write('11,Hello World\n');
    myStream.write('21,One ');
    myStream.write('more row\n');
    myStream.end();
  }, 1000);
  return myStream;
};

let streamResult;
connection.query(
  {
    sql: sql,
    values: [badPath, ','],
    infileStreamFactory: createMyStream
  },
  (err, result) => {
    if (err) {
      throw err;
    }
    streamResult = result;
    connection.end();
  }
);

process.on('exit', () => {
  assert.equal(ok.affectedRows, 4);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].id, 1);
  assert.equal(rows[0].title.trim(), 'Hello World');

  assert.equal(
    loadErr.message,
    `As a result of LOCAL INFILE command server wants to read /does_not_exist.csv file, but as of v2.0 you must provide streamFactory option returning ReadStream.`
  );
  assert.equal(loadResult.affectedRows, 0);

  assert.equal(streamResult.affectedRows, 2);
});
