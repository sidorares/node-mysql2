'use strict';

const { assert } = require('poku');
const Query = require('../../../lib/commands/query.js');

const testError = new Error('something happened');
const testQuery = new Query({}, (err, res) => {
  assert.equal(err, testError);
  assert.equal(res, null);
});

testQuery._rowParser = new (class FailingRowParser {
  next() {
    throw testError;
  }
})();

testQuery.row({
  isEOF: () => false,
});
