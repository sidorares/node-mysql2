'use strict';

const createConnection = require('../common.js').createConnection;
const test = require('utest');
const assert = require('assert');

const query =
  'SELECT result FROM (SELECT 1 as result) temp WHERE temp.result=:named';
const values = { named: 1 };

test('Test namedPlaceholder as command parameter', {
  'Enabled in connection config, disabled in query command': () => {
    // enabled in initial config, disable in test
    const c = createConnection({ namedPlaceholders: true });
    c.query({ sql: query, namedPlaceholders: false }, values, function(err) {
      if (!err || !err.sqlMessage.match(/right syntax to use near ':named'/)) {
        assert.fail(
          'Expected err.sqlMessage to contain "right syntax to use near \':named\'" sqlMessage: ' +
            err.sqlMessage
        );
      }
      c.end();
    });
  },
  'Disabled in connection config, enable query command': () => {
    const c = createConnection({ namedPlaceholders: false });
    c.query({ sql: query, namedPlaceholders: true }, values, function(
      err,
      rows
    ) {
      assert.ifError(err);
      assert.equal(rows[0].result, 1);
      c.end();
    });
  },
  'Disabled in connection config, enable execute command': () => {
    const c = createConnection({ namedPlaceholders: false });
    c.execute({ sql: query, namedPlaceholders: true }, values, function(
      err,
      rows
    ) {
      assert.ifError(err);
      assert.equal(rows[0].result, 1);
      c.end();
    });
  }
});
