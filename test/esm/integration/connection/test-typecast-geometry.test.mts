import type { RowDataPacket, TypeCastGeometry } from '../../../../index.js';
import { Buffer } from 'node:buffer';
import { assert, test } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

type GeometryRow = RowDataPacket & { foo: TypeCastGeometry };
type BufferRow = RowDataPacket & { foo: Buffer };

test(async () => {
  const connection = createConnection();
  const mySQLVersion = await getMysqlVersion(connection);

  connection.query('select 1', () => {
    // mysql8 renamed some standard functions
    // see https://dev.mysql.com/doc/refman/8.0/en/gis-wkb-functions.html
    const stPrefix = mySQLVersion.major >= 8 ? 'ST_' : '';

    connection.query<GeometryRow[]>(
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
      }
    );

    connection.query<BufferRow[]>(
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
      }
    );

    connection.end();
  });
});
