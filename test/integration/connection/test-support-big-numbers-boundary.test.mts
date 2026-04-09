import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

/**
 * Regression test for https://github.com/sidorares/node-mysql2/issues/3597
 *
 * With supportBigNumbers enabled, values outside [MIN_SAFE_INTEGER, MAX_SAFE_INTEGER]
 * must be returned as strings. ±2^53 (MAX_SAFE_INTEGER ± 1) was previously returned
 * as a number because the toString() round-trip check passed (the value is exactly
 * representable as a double, but is not a safe integer).
 */

type BoundaryRow = RowDataPacket & {
  'MIN_SAFE - 2': number | string;
  'MIN_SAFE - 1': number | string;
  MIN_SAFE: number | string;
  MAX_SAFE: number | string;
  'MAX_SAFE + 1': number | string;
  'MAX_SAFE + 2': number | string;
};

const expectations: [keyof BoundaryRow, string][] = [
  ['MIN_SAFE - 2', 'string'],
  ['MIN_SAFE - 1', 'string'],
  ['MIN_SAFE', 'number'],
  ['MAX_SAFE', 'number'],
  ['MAX_SAFE + 1', 'string'],
  ['MAX_SAFE + 2', 'string'],
];

await describe('supportBigNumbers boundary — issue #3597', async () => {
  const connection = createConnection({
    supportBigNumbers: true,
  }).promise();

  await it('text protocol (query) returns strings outside safe integer range', async () => {
    const [rows] = await connection.query<BoundaryRow[]>(`
        SELECT
          -9007199254740993 AS \`MIN_SAFE - 2\`,
          -9007199254740992 AS \`MIN_SAFE - 1\`,
          -9007199254740991 AS \`MIN_SAFE\`,
           9007199254740991 AS \`MAX_SAFE\`,
           9007199254740992 AS \`MAX_SAFE + 1\`,
           9007199254740993 AS \`MAX_SAFE + 2\`
      `);

    for (const [col, expectedType] of expectations) {
      strict.strictEqual(
        typeof rows[0][col],
        expectedType,
        `query: ${String(col)} should be ${expectedType}`
      );
    }
  });

  await it('binary protocol (execute) returns strings outside safe integer range', async () => {
    const [rows] = await connection.execute<BoundaryRow[]>(`
        SELECT
          CAST(-9007199254740993 AS SIGNED) AS \`MIN_SAFE - 2\`,
          CAST(-9007199254740992 AS SIGNED) AS \`MIN_SAFE - 1\`,
          CAST(-9007199254740991 AS SIGNED) AS \`MIN_SAFE\`,
          CAST( 9007199254740991 AS SIGNED) AS \`MAX_SAFE\`,
          CAST( 9007199254740992 AS SIGNED) AS \`MAX_SAFE + 1\`,
          CAST( 9007199254740993 AS SIGNED) AS \`MAX_SAFE + 2\`
      `);

    for (const [col, expectedType] of expectations) {
      strict.strictEqual(
        typeof rows[0][col],
        expectedType,
        `execute: ${String(col)} should be ${expectedType}`
      );
    }
  });

  await connection.end();
});
