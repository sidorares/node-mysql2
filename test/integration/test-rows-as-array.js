var createConnection = require('../common.js').createConnection;
var assert = require('assert');

// enabled in initial config, disable in some tets
var c = createConnection({rowsAsArray: true});
c.query('select 1+1 as a', function (err, rows, fields) {
  assert.ifError(err);
  assert.equal(rows[0][0], 2);
});

c.query({sql: 'select 1+2 as a', rowsAsArray: false}, function (err, rows, fields) {
  assert.ifError(err);
  assert.equal(rows[0].a, 3);
});

c.execute('select 1+1 as a', function (err, rows, fields) {
  assert.ifError(err);
  assert.equal(rows[0][0], 2);
});

c.execute({sql: 'select 1+2 as a', rowsAsArray: false}, function (err, rows, fields) {
  assert.ifError(err);
  assert.equal(rows[0].a, 3);
});

// disabled in initial config, enable in some tets
var c1 = createConnection({rowsAsArray: false});
c1.query('select 1+1 as a', function (err, rows, fields) {
  assert.ifError(err);
  assert.equal(rows[0].a, 2);
});

c1.query({sql: 'select 1+2 as a', rowsAsArray: true}, function (err, rows, fields) {
  assert.ifError(err);
  assert.equal(rows[0][0], 3);
});

c1.execute('select 1+1 as a', function (err, rows, fields) {
  assert.ifError(err);
  assert.equal(rows[0].a, 2);
});

c1.execute({sql: 'select 1+2 as a', rowsAsArray: true}, function (err, rows, fields) {
  assert.ifError(err);
  assert.equal(rows[0][1], 3);
});


c.end();
c1.end();
