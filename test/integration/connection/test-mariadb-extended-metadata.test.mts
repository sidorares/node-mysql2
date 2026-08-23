import type { FieldPacket, RowDataPacket } from '../../../index.js';
import { Buffer } from 'node:buffer';
import { describe, it, skip, strict } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

type TypesRow = RowDataPacket & {
  u: string;
  i4: string;
  i6: string;
  v: Buffer;
  j: { tag: string; nums: number[] };
};

const uuid = '123e4567-e89b-12d3-a456-426614174000';
const inet4 = '203.0.113.7';
const inet6 = '2001:db8::1';
const vectorFloats = [1.5, -2.25, 3.75];
const json = { tag: 'x', nums: [1, 2, 3] };

const vector = Buffer.alloc(vectorFloats.length * 4);
vectorFloats.forEach((value, i) => vector.writeFloatLE(value, i * 4));

const table = 'mariadb_extended_metadata_test';

const connection = createConnection().promise();

const { major, minor, version, isMariaDB } = await getMysqlVersion(connection);

// VECTOR requires MariaDB 11.7+; UUID, INET4, INET6 and the extended
// metadata capability are older (MariaDB 10.5–10.10)
if (!isMariaDB || major < 11 || (major === 11 && minor < 7)) {
  await connection.end();
  skip(
    `Skipping the test, required server is MariaDB 11.7 and above, actual server is ${version}`
  );
}

await describe('MariaDB extended type metadata', async () => {
  await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
  await connection.query(
    `CREATE TABLE \`${table}\` (u UUID, i4 INET4, i6 INET6, v VECTOR(3) NOT NULL, j JSON)`
  );
  await connection.execute(
    `INSERT INTO \`${table}\` (u, i4, i6, v, j) VALUES (?, ?, ?, ?, ?)`,
    [uuid, inet4, inet6, vector, JSON.stringify(json)]
  );

  const checkFields = (fields: FieldPacket[]) => {
    const byName = new Map(fields.map((f) => [f.name, f]));
    strict.equal(byName.get('u')?.extendedTypeName, 'uuid');
    strict.equal(byName.get('i4')?.extendedTypeName, 'inet4');
    strict.equal(byName.get('i6')?.extendedTypeName, 'inet6');
    strict.equal(byName.get('j')?.extendedFormat, 'json');
    strict.equal(byName.get('v')?.extendedTypeName, undefined);
  };

  const checkRow = (row: TypesRow) => {
    strict.equal(row.u, uuid);
    strict.equal(row.i4, inet4);
    strict.equal(row.i6, inet6);
    strict.ok(Buffer.isBuffer(row.v));
    strict.deepEqual(
      vectorFloats.map((_, i) => row.v.readFloatLE(i * 4)),
      vectorFloats
    );
    strict.deepEqual(row.j, json);
  };

  await it('query: should expose extended metadata and parse values', async () => {
    const [rows, fields] = await connection.query<TypesRow[]>(
      `SELECT * FROM \`${table}\``
    );
    checkFields(fields);
    checkRow(rows[0]);
  });

  await it('execute: should expose extended metadata and parse values', async () => {
    const [rows, fields] = await connection.execute<TypesRow[]>(
      `SELECT * FROM \`${table}\``
    );
    checkFields(fields);
    checkRow(rows[0]);
  });

  await it('execute: should accept a JS object for a JSON column', async () => {
    await connection.execute(`DELETE FROM \`${table}\` WHERE i4 IS NULL`);
    await connection.execute(`INSERT INTO \`${table}\` (v, j) VALUES (?, ?)`, [
      vector,
      json,
    ]);
    const [rows] = await connection.execute<TypesRow[]>(
      `SELECT j FROM \`${table}\` WHERE i4 IS NULL`
    );
    strict.deepEqual(rows[0].j, json);
    await connection.execute(`DELETE FROM \`${table}\` WHERE i4 IS NULL`);
  });

  await it('typeCast: should receive extended metadata', async () => {
    const seen = new Map<string, [string | undefined, string | undefined]>();
    await connection.query({
      sql: `SELECT * FROM \`${table}\``,
      typeCast: (field, next) => {
        seen.set(field.name, [field.extendedTypeName, field.extendedFormat]);
        return next();
      },
    });
    strict.deepEqual(seen.get('u'), ['uuid', undefined]);
    strict.deepEqual(seen.get('i4'), ['inet4', undefined]);
    strict.deepEqual(seen.get('i6'), ['inet6', undefined]);
    strict.deepEqual(seen.get('j'), [undefined, 'json']);
  });
});

await describe('MariaDB extended type metadata: jsonStrings', async () => {
  const jsonStringsConnection = createConnection({
    jsonStrings: true,
  }).promise();

  await it('should return JSON columns as strings', async () => {
    const [rows] = await jsonStringsConnection.query<TypesRow[]>(
      `SELECT j FROM \`${table}\``
    );
    strict.equal(typeof rows[0].j, 'string');
    const [executeRows] = await jsonStringsConnection.execute<TypesRow[]>(
      `SELECT j FROM \`${table}\``
    );
    strict.equal(typeof executeRows[0].j, 'string');
  });

  await jsonStringsConnection.end();
});

await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
await connection.end();
