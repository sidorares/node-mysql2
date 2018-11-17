'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert-diff');

// https://github.com/sidorares/node-mysql2/issues/130
// https://github.com/sidorares/node-mysql2/issues/37
// binary protocol examples where `prepare` returns no column definitions but execute() does return fields/rows

let rows;
let fields;

connection.execute('explain SELECT 1', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }

  rows = _rows;
  fields = _fields;
  connection.end();
});

const expectedRows = [
  {
    id: 1,
    select_type: 'SIMPLE',
    table: null,
    type: null,
    possible_keys: null,
    key: null,
    key_len: null,
    ref: null,
    rows: null,
    Extra: 'No tables used',
    partitions: null,
    filtered: null
  }
];

const expectedFields = [
  {
    catalog: 'def',
    schema: '',
    name: 'id',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 63,
    columnLength: 3,
    columnType: 8,
    flags: 161,
    decimals: 0
  },
  {
    catalog: 'def',
    schema: '',
    name: 'select_type',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 76,
    columnType: 253,
    flags: 1,
    decimals: 31
  },
  {
    catalog: 'def',
    schema: '',
    name: 'table',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 256,
    columnType: 253,
    flags: 0,
    decimals: 31
  },
  {
    catalog: 'def',
    schema: '',
    name: 'partitions',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 25264128,
    columnType: 250,
    flags: 0,
    decimals: 31
  },
  {
    catalog: 'def',
    schema: '',
    name: 'type',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 40,
    columnType: 253,
    flags: 0,
    decimals: 31
  },
  {
    catalog: 'def',
    schema: '',
    name: 'possible_keys',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 16384,
    columnType: 253,
    flags: 0,
    decimals: 31
  },
  {
    catalog: 'def',
    schema: '',
    name: 'key',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 256,
    columnType: 253,
    flags: 0,
    decimals: 31
  },
  {
    catalog: 'def',
    schema: '',
    name: 'key_len',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 16384,
    columnType: 253,
    flags: 0,
    decimals: 31
  },
  {
    catalog: 'def',
    schema: '',
    name: 'ref',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 4096,
    columnType: 253,
    flags: 0,
    decimals: 31
  },
  {
    catalog: 'def',
    schema: '',
    name: 'rows',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 63,
    columnLength: 10,
    columnType: 8,
    flags: 160,
    decimals: 0
  },
  {
    catalog: 'def',
    schema: '',
    name: 'filtered',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 63,
    columnLength: 4,
    columnType: 5,
    flags: 128,
    decimals: 2
  },
  {
    catalog: 'def',
    schema: '',
    name: 'Extra',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    columnLength: 1020,
    columnType: 253,
    flags: 1,
    decimals: 31
  }
];

process.on('exit', () => {
  assert.deepEqual(rows, expectedRows);
  fields.forEach((f, index) => {
    const fi = f.inspect();
    assert.deepEqual(
      Object.keys(fi).sort(),
      Object.keys(expectedFields[index]).sort()
    );
    assert.deepEqual(expectedFields[index], fi);
  });
});
