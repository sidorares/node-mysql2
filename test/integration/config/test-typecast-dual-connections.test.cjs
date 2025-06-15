'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');

// Create two connections with different typecast configurations
const connectionTypeCastTrue = common.createConnection({
  typeCast: true,
});

const connectionTypeCastFalse = common.createConnection({
  typeCast: false,
});

function cleanupConnections() {
  try {
    connectionTypeCastTrue.end();
  } catch (err) {
    // Connection might already be closed
  }
  try {
    connectionTypeCastFalse.end();
  } catch (err) {
    // Connection might already be closed
  }
}

process.on('exit', cleanupConnections);
process.on('SIGINT', () => {
  cleanupConnections();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupConnections();
  process.exit(0);
});

// Test connection with typeCast: true
connectionTypeCastTrue.query('SELECT 1', (err, results) => {
  assert.ifError(err);
  assert.equal(typeof results[0]['1'], 'number');
  assert.equal(results[0]['1'], 1);
  console.log(
    'typeCast: true - Result type:',
    typeof results[0]['1'],
    'Value:',
    results[0]['1']
  );
  connectionTypeCastTrue.end();
});

// Test connection with typeCast: false
connectionTypeCastFalse.query('SELECT 1', (err, results) => {
  assert.ifError(err);
  assert(
    Buffer.isBuffer(results[0]['1']),
    'Result should be a Buffer when typeCast is false'
  );
  assert.equal(results[0]['1'].toString(), '1');
  console.log(
    'typeCast: false - Result type:',
    typeof results[0]['1'],
    'Is Buffer:',
    Buffer.isBuffer(results[0]['1']),
    'Value:',
    results[0]['1'].toString()
  );
  connectionTypeCastFalse.end();
});
