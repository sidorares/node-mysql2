'use strict';

const mysql = require('../../../../index.js');
const common = require('../../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale (unsupported non utf8 charsets)');
  process.exit(0);
}

const connection = common.createConnection();

const payload = 'привет, мир';

function tryEncoding(encoding, cb) {
  connection.query('set character_set_results = ?', [encoding], (err) => {
    assert.ifError(err);
    connection.query('SELECT ?', [payload], (err, rows, fields) => {
      assert.ifError(err);
      let iconvEncoding = encoding;
      if (encoding === 'utf8mb4') {
        iconvEncoding = 'utf8';
      }
      assert.equal(
        mysql.CharsetToEncoding[fields[0].characterSet],
        iconvEncoding,
      );
      assert.equal(fields[0].name, payload);
      assert.equal(rows[0][fields[0].name], payload);
      cb();
    });
  });
}

function tryEncodingExecute(encoding, cb) {
  connection.execute('set character_set_results = ?', [encoding], (err) => {
    assert.ifError(err);
    connection.execute('SELECT ? as n', [payload], (err, rows, fields) => {
      assert.ifError(err);
      let iconvEncoding = encoding;
      if (encoding === 'utf8mb4') {
        iconvEncoding = 'utf8';
      }
      assert.equal(
        mysql.CharsetToEncoding[fields[0].characterSet],
        iconvEncoding,
      );
      // TODO: figure out correct metadata encodings setup for binary protocol
      //  assert.equal(fields[0].name, payload);
      assert.equal(rows[0][fields[0].name], payload);
      cb();
    });
  });
}

// christmas tree!!! :)
tryEncoding('cp1251', () => {
  tryEncoding('koi8r', () => {
    tryEncoding('cp866', () => {
      tryEncoding('utf8mb4', () => {
        tryEncodingExecute('cp1251', () => {
          tryEncodingExecute('koi8r', () => {
            tryEncodingExecute('cp866', () => {
              tryEncodingExecute('utf8mb4', () => {
                connection.end();
              });
            });
          });
        });
      });
    });
  });
});
