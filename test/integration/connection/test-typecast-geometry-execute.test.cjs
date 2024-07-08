'use strict';

const common = require('../../common.test.cjs');
const { test, assert } = require('poku');
const { Buffer } = require('node:buffer');

test(async () => {
  const connection = common.createConnection();
  const mySQLVersion = await common.getMysqlVersion(connection);

  connection.execute('select 1', () => {
    // mysql8 renamed some standard functions
    // see https://dev.mysql.com/doc/refman/8.0/en/gis-wkb-functions.html
    const stPrefix = mySQLVersion.major >= 8 ? 'ST_' : '';

    connection.execute(
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

    connection.execute(
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
});
