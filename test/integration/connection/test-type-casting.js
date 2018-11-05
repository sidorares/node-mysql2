'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

common.useTestDb(connection);

const tests = require('./type-casting-tests')(connection);

const table = 'type_casting';

const schema = [];
const inserts = [];

tests.forEach((test, index) => {
  const escaped = test.insertRaw || connection.escape(test.insert);

  test.columnName = test.type + '_' + index;

  schema.push('`' + test.columnName + '` ' + test.type + ',');
  inserts.push('`' + test.columnName + '` = ' + escaped);
});

const createTable = [
  'CREATE TEMPORARY TABLE `' + table + '` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,'
]
  .concat(schema)
  .concat(['PRIMARY KEY (`id`)', ') ENGINE=InnoDB DEFAULT CHARSET=utf8'])
  .join('\n');

connection.query(createTable);

connection.query('INSERT INTO ' + table + ' SET' + inserts.join(',\n'));

let row;
connection.query('SELECT * FROM type_casting', (err, rows) => {
  if (err) {
    throw err;
  }

  row = rows[0];
  connection.end();
});

process.on('exit', () => {
  tests.forEach(test => {
    let expected = test.expect || test.insert;
    let got = row[test.columnName];
    let message;

    if (expected instanceof Date) {
      assert.equal(got instanceof Date, true, test.type);

      expected = String(expected);
      got = String(got);
    } else if (Buffer.isBuffer(expected)) {
      assert.equal(Buffer.isBuffer(got), true, test.type);

      expected = String(Array.prototype.slice.call(expected));
      got = String(Array.prototype.slice.call(got));
    }

    if (test.deep) {
      message =
        'got: "' +
        JSON.stringify(got) +
        '" expected: "' +
        JSON.stringify(expected) +
        '" test: ' +
        test.type +
        '';
      assert.deepEqual(expected, got, message);
    } else {
      message =
        'got: "' +
        got +
        '" (' +
        typeof got +
        ') expected: "' +
        expected +
        '" (' +
        typeof expected +
        ') test: ' +
        test.type +
        '';
      assert.strictEqual(expected, got, message);
    }
  });
});
