import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

type ValueRow = RowDataPacket & { value: string };
type LengthRow = RowDataPacket & { byteLength: number };
type OkRow = RowDataPacket & { ok: number };

// A length-coded integer in [0xFFFF, 0xFFFFFF) is written as the 0xFD tag plus
// a 3-byte integer. Any parameter whose encoded byte length lands in that range
// exercises the branch where the packet size is computed.
const BOUNDARY = 0xffff;

const probe = createConnection().promise();
const server = await getMysqlVersion(probe);
await probe.end();

const supportsQueryAttributes =
  !server.isMariaDB &&
  (server.major > 8 ||
    (server.major === 8 && (server.minor > 0 || server.patch >= 23)));

if (!supportsQueryAttributes) {
  console.log(
    `Skipping query attribute tests: requires MySQL 8.0.23+, got ${server.version}`
  );
}

await describe('Regression #4499 — parameter byte lengths at the 0xFD boundary', async () => {
  await describe('COM_STMT_EXECUTE', async () => {
    const connection = createConnection().promise();

    await it('should bind a string of exactly 0xFFFF bytes', async () => {
      const value = 'x'.repeat(BOUNDARY);
      const [rows] = await connection.execute<ValueRow[]>('SELECT ? AS value', [
        value,
      ]);

      strict.equal(rows[0].value, value);
    });

    await it('should bind a string whose byte length alone passes 0xFFFF', async () => {
      const value = 'ä'.repeat(40000);

      strict.ok(value.length < BOUNDARY);
      strict.ok(Buffer.byteLength(value, 'utf8') > BOUNDARY);

      const [rows] = await connection.execute<ValueRow[]>('SELECT ? AS value', [
        value,
      ]);

      strict.equal(rows[0].value, value);
    });

    await it('should bind a JSON parameter above 0xFFFF bytes', async () => {
      const value = { payload: 'x'.repeat(BOUNDARY) };
      const [rows] = await connection.execute<ValueRow[]>('SELECT ? AS value', [
        value,
      ]);

      strict.deepEqual(JSON.parse(rows[0].value), value);
    });

    await it('should bind a Buffer above 0xFFFF bytes', async () => {
      const value = Buffer.alloc(BOUNDARY + 1, 0x61);
      const [rows] = await connection.execute<LengthRow[]>(
        'SELECT LENGTH(?) AS byteLength',
        [value]
      );

      strict.equal(Number(rows[0].byteLength), value.length);
    });

    await connection.end();
  });

  if (!supportsQueryAttributes) {
    return;
  }

  await describe('COM_QUERY attributes', async () => {
    const connection = createConnection().promise();

    await it('should send an attribute above 0xFFFF bytes', async () => {
      const [rows] = await connection.query<OkRow[]>({
        sql: 'SELECT 1 AS ok',
        attributes: { payload: 'x'.repeat(BOUNDARY) },
      });

      strict.equal(rows[0].ok, 1);
    });

    await connection.end();
  });

  await describe('COM_STMT_EXECUTE attributes', async () => {
    const connection = createConnection().promise();

    await it('should send an attribute above 0xFFFF bytes', async () => {
      const [rows] = await connection.execute<OkRow[]>({
        sql: 'SELECT ? AS ok',
        values: [1],
        attributes: { payload: 'x'.repeat(BOUNDARY) },
      });

      strict.equal(rows[0].ok, 1);
    });

    await connection.end();
  });
});
