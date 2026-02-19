import type { RowDataPacket, TypeCastGeometry } from '../../../index.js';
import { Buffer } from 'node:buffer';
import { assert, describe, it } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

type GeometryRow = RowDataPacket & { foo: TypeCastGeometry };
type BufferRow = RowDataPacket & { foo: Buffer };

await describe('Typecast Geometry', async () => {
  const connection = createConnection();
  const mySQLVersion = await getMysqlVersion(connection);

  await it('should typecast geometry fields with query', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query('select 1', (err) => (err ? reject(err) : resolve()));
    });

    // mysql8 renamed some standard functions
    // see https://dev.mysql.com/doc/refman/8.0/en/gis-wkb-functions.html
    const stPrefix = mySQLVersion.major >= 8 ? 'ST_' : '';

    const geometryRes = await new Promise<GeometryRow[]>((resolve, reject) => {
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
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });

    assert.deepEqual(geometryRes[0].foo, { x: 11, y: 0 });

    const bufferRes = await new Promise<BufferRow[]>((resolve, reject) => {
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
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });

    assert.equal(Buffer.isBuffer(bufferRes[0].foo), true);
  });

  connection.end();
});
