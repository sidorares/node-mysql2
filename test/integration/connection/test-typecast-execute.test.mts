import type {
  RowDataPacket,
  TypeCastField,
  TypeCastNext,
} from '../../../index.js';
import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type FooRow = RowDataPacket & { foo: string };
type FooBufferRow = RowDataPacket & { foo: Buffer };
type TestValueRow = RowDataPacket & { test: null; value: number };
type JsonTestRow = RowDataPacket & { json_test: { test: number } };
type GeomTestRow = RowDataPacket & {
  p: { x: number; y: number };
  g: { x: number; y: number }[];
};

await describe('Typecast Execute', async () => {
  const connection = createConnection();

  connection.execute('CREATE TEMPORARY TABLE json_test (json_test JSON)');
  connection.execute('INSERT INTO json_test VALUES (?)', [
    JSON.stringify({ test: 42 }),
  ]);

  connection.execute(
    'CREATE TEMPORARY TABLE geom_test (p POINT, g GEOMETRY NOT NULL)'
  );
  connection.execute(
    'INSERT INTO geom_test VALUES (ST_GeomFromText(?), ST_GeomFromText(?))',
    [
      'POINT(1 1)',
      'LINESTRING(-71.160281 42.258729,-71.160837 42.259113,-71.161144 42.25932)',
    ]
  );

  await it('should typecast uppercase', async () => {
    const res = await new Promise<FooRow[]>((resolve, reject) => {
      connection.execute<FooRow[]>(
        {
          sql: 'select "foo uppercase" as foo',
          typeCast: function (field: TypeCastField, next: TypeCastNext) {
            strict.equal('number', typeof field.length);
            if (field.type === 'VAR_STRING') {
              return field.string()?.toUpperCase();
            }
            return next();
          },
        },
        (err, _res) => (err ? reject(err) : resolve(_res))
      );
    });

    strict.equal(res[0].foo, 'FOO UPPERCASE');
  });

  await it('should return buffer when typeCast is false', async () => {
    const res = await new Promise<FooBufferRow[]>((resolve, reject) => {
      connection.execute<FooBufferRow[]>(
        {
          sql: 'select "foobar" as foo',
          typeCast: false,
        },
        (err, _res) => (err ? reject(err) : resolve(_res))
      );
    });

    strict(Buffer.isBuffer(res[0].foo));
    strict.equal(res[0].foo.toString('utf8'), 'foobar');
  });

  await it('should handle null and pass-through with next()', async () => {
    const rows = await new Promise<TestValueRow[]>((resolve, reject) => {
      connection.execute<TestValueRow[]>(
        {
          sql: 'SELECT NULL as test, 6 as value;',
          typeCast: function (_field: TypeCastField, next: TypeCastNext) {
            return next();
          },
        },
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    strict.equal(rows[0].test, null);
    strict.equal(rows[0].value, 6);
  });

  await it('should typecast JSON with execute', async () => {
    const rows = await new Promise<JsonTestRow[]>((resolve, reject) => {
      connection.execute<JsonTestRow[]>(
        {
          sql: 'SELECT * from json_test',
          typeCast: function (_field: TypeCastField, next: TypeCastNext) {
            return next();
          },
        },
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    strict.equal(rows[0].json_test.test, 42);
  });

  // read geo fields
  await it('should read geometry fields', async () => {
    const res = await new Promise<GeomTestRow[]>((resolve, reject) => {
      connection.execute<GeomTestRow[]>(
        {
          sql: 'select * from geom_test',
        },
        (err, _res) => (err ? reject(err) : resolve(_res))
      );
    });

    strict.deepEqual({ x: 1, y: 1 }, res[0].p);
    strict.deepEqual(
      [
        { x: -71.160281, y: 42.258729 },
        { x: -71.160837, y: 42.259113 },
        { x: -71.161144, y: 42.25932 },
      ],
      res[0].g
    );
  });

  await it('should typecast geometry fields with custom typeCast', async () => {
    const res = await new Promise<GeomTestRow[]>((resolve, reject) => {
      connection.execute<GeomTestRow[]>(
        {
          sql: 'select * from geom_test',
          typeCast: function (field: TypeCastField, _next: TypeCastNext) {
            strict.equal('geom_test', field.table);

            if (field.name === 'p' && field.type === 'GEOMETRY') {
              strict.deepEqual({ x: 1, y: 1 }, field.geometry());
              return { x: 2, y: 2 };
            }

            if (field.name === 'g' && field.type === 'GEOMETRY') {
              strict.deepEqual(
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

            strict.fail('should not reach here');
          },
        },
        (err, _res) => (err ? reject(err) : resolve(_res))
      );
    });

    strict.deepEqual({ x: 2, y: 2 }, res[0].p);
    strict.deepEqual(
      [
        { x: -70, y: 40 },
        { x: -60, y: 50 },
        { x: -50, y: 60 },
      ],
      res[0].g
    );
  });

  connection.end();
});
