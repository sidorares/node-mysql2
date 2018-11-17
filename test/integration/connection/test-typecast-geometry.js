'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

connection.query(
  {
    sql: "select GeomFromText('POINT(11 0)') as foo",
    typeCast: function(field, next) {
      if (field.type === 'GEOMETRY') {
        return field.geometry();
      }
      return next();
    }
  },
  (err, res) => {
    assert.ifError(err);
    assert.deepEqual(res[0].foo, { x: 11, y: 0 });
  }
);

connection.query(
  {
    sql: "select GeomFromText('POINT(11 0)') as foo",
    typeCast: function(field, next) {
      if (field.type === 'GEOMETRY') {
        return field.buffer();
      }
      return next();
    }
  },
  (err, res) => {
    assert.ifError(err);
    assert.equal(Buffer.isBuffer(res[0].foo), true);
  }
);

connection.end();
