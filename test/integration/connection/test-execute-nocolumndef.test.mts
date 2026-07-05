// This file was modified by Oracle on June 2, 2021.
// The test has been updated to remove all expectations with regards to the
// "columnLength" metadata field.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

import type { FieldPacket, RowDataPacket } from '../../../index.js';
import process from 'node:process';
// @ts-expect-error: no typings available
import strict from 'assert-diff';
import { describe, it, skip } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale: different error codes');
}

// https://github.com/sidorares/node-mysql2/issues/130
// https://github.com/sidorares/node-mysql2/issues/37
// binary protocol examples where `prepare` returns no column definitions but execute() does return fields/rows

const expectedRows = [
  {
    id: 1,
    select_type: 'SIMPLE',
    table: null,
    type: null,
    possible_keys: null,
    key: null,
    key_len: null,
    ref: null,
    rows: null,
    Extra: 'No tables used',
    partitions: null,
    filtered: null,
  },
];

const expectedFields = [
  {
    catalog: 'def',
    schema: '',
    name: 'id',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 63,
    encoding: 'binary',
    type: 8,
    flags: 161,
    decimals: 0,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'select_type',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 253,
    flags: 1,
    decimals: 31,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'table',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 253,
    flags: 0,
    decimals: 31,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'partitions',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 250,
    flags: 0,
    decimals: 31,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'type',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 253,
    flags: 0,
    decimals: 31,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'possible_keys',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 253,
    flags: 0,
    decimals: 31,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'key',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 253,
    flags: 0,
    decimals: 31,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'key_len',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 253,
    flags: 0,
    decimals: 31,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'ref',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 253,
    flags: 0,
    decimals: 31,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'rows',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 63,
    encoding: 'binary',
    type: 8,
    flags: 160,
    decimals: 0,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'filtered',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 63,
    encoding: 'binary',
    type: 5,
    flags: 128,
    decimals: 2,
  },
  {
    catalog: 'def',
    schema: '',
    name: 'Extra',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 224,
    encoding: 'utf8',
    type: 253,
    flags: 1,
    decimals: 31,
  },
];

// MariaDB's EXPLAIN has no partitions/filtered columns and reports most
// columns as VAR_STRING
const mariadbTextField = (name: string, flags: number) => ({
  catalog: 'def',
  schema: '',
  name,
  orgName: '',
  table: '',
  orgTable: '',
  characterSet: 224,
  encoding: 'utf8',
  type: 253,
  flags,
  decimals: 39,
});

const expectedRowsMariaDB = [
  {
    id: 1,
    select_type: 'SIMPLE',
    table: null,
    type: null,
    possible_keys: null,
    key: null,
    key_len: null,
    ref: null,
    rows: null,
    Extra: 'No tables used',
  },
];

const expectedFieldsMariaDB = [
  {
    catalog: 'def',
    schema: '',
    name: 'id',
    orgName: '',
    table: '',
    orgTable: '',
    characterSet: 63,
    encoding: 'binary',
    type: 8,
    flags: 160,
    decimals: 0,
  },
  mariadbTextField('select_type', 1),
  mariadbTextField('table', 0),
  mariadbTextField('type', 0),
  mariadbTextField('possible_keys', 0),
  mariadbTextField('key', 0),
  mariadbTextField('key_len', 0),
  mariadbTextField('ref', 0),
  mariadbTextField('rows', 0),
  mariadbTextField('Extra', 1),
];

await describe('Execute No Column Definition', async () => {
  const connection = createConnection();
  const { isMariaDB } = await getMysqlVersion(connection);
  const rowsExpectation = isMariaDB ? expectedRowsMariaDB : expectedRows;
  const fieldsExpectation = isMariaDB ? expectedFieldsMariaDB : expectedFields;

  await it('should handle explain with no column definitions', async () => {
    const [rows, fields] = await new Promise<[RowDataPacket[], FieldPacket[]]>(
      (resolve, reject) => {
        connection.execute<RowDataPacket[]>(
          'explain SELECT 1',
          (err, _rows, _fields) =>
            err ? reject(err) : resolve([_rows, _fields])
        );
      }
    );

    strict.deepEqual(rows, rowsExpectation);
    fields.forEach((f: FieldPacket, index: number) => {
      // @ts-expect-error: TODO: implement typings
      const fi = f.inspect();
      // "columnLength" is non-deterministic
      delete fi.columnLength;

      strict.deepEqual(
        Object.keys(fi).sort(),
        Object.keys(fieldsExpectation[index]).sort()
      );
      strict.deepEqual(fieldsExpectation[index], fi);
    });
  });

  connection.end();
});
