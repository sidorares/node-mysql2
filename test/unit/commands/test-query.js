'use strict';

const assert = require('assert');
const Query = require('../../../lib/commands/query');

const testError = new Error('something happened');
const testQuery = new Query({}, (err, res) => {
  assert.equal(err, testError);
  assert.equal(res, null);
});

testQuery._rowParser = new class FailingRowParser {
  next() {
    throw testError;
  }
}();

testQuery.row({
  isEOF: () => false
});
