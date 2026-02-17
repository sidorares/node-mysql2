import type {
  QueryError,
  ResultSetHeader,
  RowDataPacket,
} from '../../../../index.js';
import fs from 'node:fs';
import process from 'node:process';
import { PassThrough } from 'node:stream';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const connection = createConnection();

const table = 'load_data_test';
connection.query('SET GLOBAL local_infile = true', assert.ifError);
connection.query(
  [
    `CREATE TEMPORARY TABLE \`${table}\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n')
);

const path = './test/fixtures/data.csv';
const sql =
  `LOAD DATA LOCAL INFILE ? INTO TABLE ${table} ` +
  `FIELDS TERMINATED BY ? (id, title)`;

let ok: ResultSetHeader;
connection.query<ResultSetHeader>(
  {
    sql,
    values: [path, ','],
    infileStreamFactory: () => fs.createReadStream(path),
  },
  (err, _ok) => {
    if (err) {
      throw err;
    }
    ok = _ok;
  }
);

let rows: RowDataPacket[];
connection.query<RowDataPacket[]>(`SELECT * FROM ${table}`, (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
});

// Try to load a file that does not exist to see if we handle this properly
let loadErr: QueryError | null = null;
let loadResult: ResultSetHeader;
const badPath = '/does_not_exist.csv';

connection.query<ResultSetHeader>(sql, [badPath, ','], (err, result) => {
  loadErr = err;
  loadResult = result;
});

// test path mapping
const createMyStream = function () {
  const myStream = new PassThrough();
  setTimeout(() => {
    myStream.write('11,Hello World\n');
    myStream.write('21,One ');
    myStream.write('more row\n');
    myStream.end();
  }, 1000);
  return myStream;
};

let streamResult: ResultSetHeader;
connection.query<ResultSetHeader>(
  {
    sql: sql,
    values: [badPath, ','],
    infileStreamFactory: createMyStream,
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

  assert(loadErr, 'Expected LOAD DATA error');
  if (!loadErr) {
    return;
  }
  assert.equal(
    loadErr.message,
    `As a result of LOCAL INFILE command server wants to read /does_not_exist.csv file, but as of v2.0 you must provide streamFactory option returning ReadStream.`
  );
  assert.equal(loadResult.affectedRows, 0);

  assert.equal(streamResult.affectedRows, 2);
});
