'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const { Buffer } = require('node:buffer');

const connection = common.createConnection();

connection.query('select 1', () => {
  const serverVersion = connection._handshakePacket.serverVersion;
  // mysql8 renamed some standard functions
  // see https://dev.mysql.com/doc/refman/8.0/en/gis-wkb-functions.html
  const stPrefix = serverVersion[0] === '8' ? 'ST_' : '';

  connection.query(
    {
      sql: `select ${stPrefix}GeomFromText('POINT(11 0)') as foo`,
      typeCast: function (field, next) {
        if (field.type === 'GEOMETRY') {
          return field.geometry();
        }
        return next();
      },
    },
    (err, res) => {
      assert.ifError(err);
      assert.deepEqual(res[0].foo, { x: 11, y: 0 });
    },
  );

  connection.query(
    {
      sql: `select ${stPrefix}GeomFromText('POINT(11 0)') as foo`,
      typeCast: function (field, next) {
        if (field.type === 'GEOMETRY') {
          return field.buffer();
        }
        return next();
      },
    },
    (err, res) => {
      assert.ifError(err);
      assert.equal(Buffer.isBuffer(res[0].foo), true);
    },
  );

  connection.end();
});
