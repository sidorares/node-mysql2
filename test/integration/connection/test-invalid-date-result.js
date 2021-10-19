// This file was modified by Oracle on June 1, 2021.
// The test has been updated to be able to pass with different default
// strict modes used by different MySQL server versions.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows = undefined;

// Disable NO_ZERO_DATE mode and NO_ZERO_IN_DATE mode to ensure the old
// behaviour.
const strictModes = ['NO_ZERO_DATE', 'NO_ZERO_IN_DATE'];

connection.query('SELECT variable_value as value FROM performance_schema.session_variables where variable_name = ?', ['sql_mode'], (err, _rows) => {
  if (err) {
    throw err;
  }

  const deprecatedSqlMode = _rows[0].value
    .split(',')
    .filter(mode => strictModes.indexOf(mode) === -1)
    .join(',');

  connection.query(`SET sql_mode=?`, [deprecatedSqlMode], err => {
    if (err) {
      throw err;
    }

    connection.execute('SELECT TIMESTAMP(0000-00-00) t', [], (err, _rows) => {
      if (err) {
        throw err;
      }

      rows = _rows;
      connection.end();
    });
  });
});

function isInvalidTime(t) {
  return isNaN(t.getTime());
}

process.on('exit', () => {
  assert.deepEqual(Object.prototype.toString.call(rows[0].t), '[object Date]');
  assert.deepEqual(isInvalidTime(rows[0].t), true);
});
