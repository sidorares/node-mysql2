'use strict';

const mysql = require('../../../../index.js');
const common = require('../../../common');
const connection = common.createConnection();
const assert = require('assert');

const payload = 'привет, мир';

function tryEncoding(encoding, cb) {
  connection.query('set character_set_results = ?', [encoding], function(err) {
    assert.ifError(err);
    connection.query('SELECT ?', [payload], function(err, rows, fields) {
      assert.ifError(err);
      let iconvEncoding = encoding;
      if (encoding == 'utf8mb4') {
        iconvEncoding = 'utf8';
      }
      assert.equal(
        mysql.CharsetToEncoding[fields[0].characterSet],
        iconvEncoding
      );
      assert.equal(fields[0].name, payload);
      assert.equal(rows[0][fields[0].name], payload);
      cb();
    });
  });
}

function tryEncodingExecute(encoding, cb) {
  connection.execute('set character_set_results = ?', [encoding], function(
    err
  ) {
    assert.ifError(err);
    connection.execute('SELECT ? as n', [payload], function(err, rows, fields) {
      assert.ifError(err);
      let iconvEncoding = encoding;
      if (encoding == 'utf8mb4') {
        iconvEncoding = 'utf8';
      }
      assert.equal(
        mysql.CharsetToEncoding[fields[0].characterSet],
        iconvEncoding
      );
      // TODO: figure out correct metadata encodings setup for binary protocol
      //  assert.equal(fields[0].name, payload);
      assert.equal(rows[0][fields[0].name], payload);
      cb();
    });
  });
}

// christmas tree!!! :)
tryEncoding('cp1251', function() {
  tryEncoding('koi8r', function() {
    tryEncoding('cp866', function() {
      tryEncoding('utf8mb4', function() {
        tryEncodingExecute('cp1251', function() {
          tryEncodingExecute('koi8r', function() {
            tryEncodingExecute('cp866', function() {
              tryEncodingExecute('utf8mb4', function() {
                connection.end();
              });
            });
          });
        });
      });
    });
  });
});
