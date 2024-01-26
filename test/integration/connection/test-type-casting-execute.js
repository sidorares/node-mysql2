'use strict';

const common = require('../../common');
const driver = require('../../../index.js'); //needed to check driver.Types
const connection = common.createConnection();
const assert = require('assert');

common.useTestDb(connection);

connection.execute('select 1', waitConnectErr => {
  assert.ifError(waitConnectErr);

  const tests = require('./type-casting-tests')(connection);

  const table = 'type_casting';

  const schema = [];
  const inserts = [];

  tests.forEach((test, index) => {
    const escaped = test.insertRaw || connection.escape(test.insert);

    test.columnName = `${test.type}_${index}`;

    schema.push(`\`${test.columnName}\` ${test.type},`);
    inserts.push(`\`${test.columnName}\` = ${escaped}`);
  });

  const createTable = [
    `CREATE TEMPORARY TABLE \`${table}\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  ]
    .concat(schema)
    .concat(['PRIMARY KEY (`id`)', ') ENGINE=InnoDB DEFAULT CHARSET=utf8'])
    .join('\n');

  connection.execute(createTable);

  connection.execute(`INSERT INTO ${table} SET ${inserts.join(',\n')}`);

  let row;
  let fieldData; // to lookup field types
  connection.execute(`SELECT * FROM ${table}`, (err, rows, fields) => {
    if (err) {
      throw err;
    }

    row = rows[0];
    // build a fieldName: fieldType lookup table
    fieldData = fields.reduce((a, v) => {
      a[v['name']] = v['type'];
      return a;
    }, {});
    connection.end();
  });

  process.on('exit', () => {
    tests.forEach(test => {
      // check that the column type matches the type name stored in driver.Types
      const columnType = fieldData[test.columnName];
      assert.equal(
        test.columnType === driver.Types[columnType],
        true,
        test.columnName,
      );
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
        message = `got: "${JSON.stringify(got)}" expected: "${JSON.stringify(
          expected,
        )}" test: ${test.type}`;
        assert.deepEqual(expected, got, message);
      } else {
        message = `got: "${got}" (${typeof got}) expected: "${expected}" (${typeof expected}) test: ${
          test.type
        }`;
        assert.strictEqual(expected, got, message);
      }
    });
  });
});
