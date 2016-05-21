var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert-diff');

// https://github.com/sidorares/node-mysql2/issues/130
// https://github.com/sidorares/node-mysql2/issues/37
// binary protocol examples where `prepare` returns no column definitions but execute() does return fields/rows

var rows;
var fields;

connection.execute('explain SELECT 1', function (err, _rows, _fields) {
  if (err) {
    throw err;
  }

  rows = _rows;
  fields = _fields;
  connection.end();
});

var expectedRows;
var expectedFields;

process.on('exit', function () {
  assert.deepEqual(rows, expectedRows);
  var fi = fields.map(function (c) { return c.inspect(); });
  for (var i; i < expectedFields.length; i++) {
    assert.deepEqual(Object.keys(fi[i]).sort(), Object.keys(expectedFields[i]).sort());
    expectedFields[i].map(function (key) {
      assert.deepEqual(expectedFields[i][key], fi[i][key]);
    });
  }
});

expectedFields = [{catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'id',
    orgName: '',
    characterSet: 63,
    columnLength: 3,
    columnType: 8,
    flags: 161,
    decimals: 0},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'select_type',
    orgName: '',
    characterSet: 33,
    columnLength: 57,
    columnType: 253,
    flags: 1,
    decimals: 31},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'table',
    orgName: '',
    characterSet: 33,
    columnLength: 192,
    columnType: 253,
    flags: 0,
    decimals: 31},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'type',
    orgName: '',
    characterSet: 33,
    columnLength: 30,
    columnType: 253,
    flags: 0,
    decimals: 31},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'possible_keys',
    orgName: '',
    characterSet: 33,
    columnLength: 12288,
    columnType: 253,
    flags: 0,
    decimals: 31},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'key',
    orgName: '',
    characterSet: 33,
    columnLength: 192,
    columnType: 253,
    flags: 0,
    decimals: 31},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'key_len',
    orgName: '',
    characterSet: 33,
    columnLength: 12288,
    columnType: 253,
    flags: 0,
    decimals: 31},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'ref',
    orgName: '',
    characterSet: 33,
    columnLength: 3072,
    columnType: 253,
    flags: 0,
    decimals: 31},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'rows',
    orgName: '',
    characterSet: 63,
    columnLength: 10,
    columnType: 8,
    flags: 160,
    decimals: 0},
  {catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'Extra',
    orgName: '',
    characterSet: 33,
    columnLength: 765,
    columnType: 253,
    flags: 1,
    decimals: 31}];

expectedRows = [{id: 1,
    select_type: 'SIMPLE',
    table: null,
    type: null,
    possible_keys: null,
    key: null,
    key_len: null,
    ref: null,
    rows: null,
    Extra: 'No tables used'}];

// mysql 5.7 has extra fields. Add them based on version to allow to run tests in 5.7 and pre 5.7
connection.on('connect', function(handshake) {
  if (handshake.serverVersion.slice(0,3) === '5.7') {
    expectedRows[0].partitions = null;
    expectedRows[0].filtered = null;
  }
});
