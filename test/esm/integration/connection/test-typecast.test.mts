import type {
  RowDataPacket,
  TypeCastField,
  TypeCastNext,
} from '../../../../index.js';
import { Buffer } from 'node:buffer';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Typecast', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE json_test (json_test JSON)');
  connection.query(
    'INSERT INTO json_test VALUES (?)',
    JSON.stringify({ test: 42 })
  );

  connection.query(
    'CREATE TEMPORARY TABLE geom_test (p POINT, g GEOMETRY NOT NULL)'
  );
  connection.query(
    'INSERT INTO geom_test VALUES (ST_GeomFromText("POINT(1 1)"), ' +
      'ST_GeomFromText("LINESTRING(-71.160281 42.258729,-71.160837 42.259113,-71.161144 42.25932)"))'
  );

  await it('should typecast uppercase', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'select "foo uppercase" as foo',
          typeCast: function (field: TypeCastField, next: TypeCastNext) {
            assert.equal('number', typeof field.length);
            if (field.type === 'VAR_STRING') {
              return field.string()?.toUpperCase();
            }
            return next();
          },
        },
        (err, res) => {
          if (err) return reject(err);
          assert.equal(res[0].foo, 'FOO UPPERCASE');
          resolve();
        }
      );
    });
  });

  await it('should return buffer when typeCast is false', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'select "foobar" as foo',
          typeCast: false,
        },
        (err, res) => {
          if (err) return reject(err);
          assert(Buffer.isBuffer(res[0].foo), 'Check for Buffer');
          assert.equal(res[0].foo.toString('utf8'), 'foobar');
          resolve();
        }
      );
    });
  });

  await it('should handle null and pass-through with next()', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'SELECT NULL as test, 6 as value;',
          typeCast: function (_field: TypeCastField, next: TypeCastNext) {
            return next();
          },
        },
        (err, _rows) => {
          if (err) return reject(err);
          assert.equal(_rows[0].test, null);
          assert.equal(_rows[0].value, 6);
          resolve();
        }
      );
    });
  });

  await it('should typecast JSON with query', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'SELECT * from json_test',
          typeCast: function (_field: TypeCastField, next: TypeCastNext) {
            return next();
          },
        },
        (err, _rows) => {
          if (err) return reject(err);
          assert.equal(_rows[0].json_test.test, 42);
          resolve();
        }
      );
    });
  });

  await it('should typecast JSON with execute', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        {
          sql: 'SELECT * from json_test',
          typeCast: function (_field: TypeCastField, next: TypeCastNext) {
            return next();
          },
        },
        (err, _rows) => {
          if (err) return reject(err);
          assert.equal(_rows[0].json_test.test, 42);
          resolve();
        }
      );
    });
  });

  // read geo fields
  await it('should read geometry fields', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'select * from geom_test',
        },
        (err, res) => {
          if (err) return reject(err);
          assert.deepEqual({ x: 1, y: 1 }, res[0].p);
          assert.deepEqual(
            [
              { x: -71.160281, y: 42.258729 },
              { x: -71.160837, y: 42.259113 },
              { x: -71.161144, y: 42.25932 },
            ],
            res[0].g
          );
          resolve();
        }
      );
    });
  });

  await it('should typecast geometry fields with custom typeCast', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'select * from geom_test',
          typeCast: function (field: TypeCastField, _next: TypeCastNext) {
            assert.equal('geom_test', field.table);

            if (field.name === 'p' && field.type === 'GEOMETRY') {
              assert.deepEqual({ x: 1, y: 1 }, field.geometry());
              return { x: 2, y: 2 };
            }

            if (field.name === 'g' && field.type === 'GEOMETRY') {
              assert.deepEqual(
                [
                  { x: -71.160281, y: 42.258729 },
                  { x: -71.160837, y: 42.259113 },
                  { x: -71.161144, y: 42.25932 },
                ],
                field.geometry()
              );

              return [
                { x: -70, y: 40 },
                { x: -60, y: 50 },
                { x: -50, y: 60 },
              ];
            }

            assert.fail('should not reach here');
          },
        },
        (err, res) => {
          if (err) return reject(err);
          assert.deepEqual({ x: 2, y: 2 }, res[0].p);
          assert.deepEqual(
            [
              { x: -70, y: 40 },
              { x: -60, y: 50 },
              { x: -50, y: 60 },
            ],
            res[0].g
          );
          resolve();
        }
      );
    });
  });

  connection.end();
});
