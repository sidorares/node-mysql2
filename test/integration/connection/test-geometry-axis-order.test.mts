import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type Row = RowDataPacket & {
  foo: { x: number; y: number };
  sx: number;
  sy: number;
};

// With swapGeometryAxisOrder on, {x, y} must equal ST_X/ST_Y on every server:
// swapped on MySQL 8.0.12+, left as stored on 5.7, 8.0.11 and MariaDB.
await describe('swapGeometryAxisOrder follows ST_X/ST_Y on any server', async () => {
  const connection = createConnection({ swapGeometryAxisOrder: true });
  const sql =
    "select ST_GeomFromText('POINT(-33.3109317 117.3461733)', 4326) as foo, " +
    "ST_X(ST_GeomFromText('POINT(-33.3109317 117.3461733)', 4326)) as sx, " +
    "ST_Y(ST_GeomFromText('POINT(-33.3109317 117.3461733)', 4326)) as sy";

  for (const method of ['query', 'execute'] as const) {
    const run = (): Promise<[Row[], unknown]> =>
      method === 'query'
        ? connection.promise().query<Row[]>(sql)
        : connection.promise().execute<Row[]>(sql);
    await it(`matches ST_X/ST_Y with ${method}`, async () => {
      const [rows] = await run();
      const { foo, sx, sy } = rows[0];
      strict.ok(Math.abs(foo.x - sx) < 1e-9, `x ${foo.x} vs ST_X ${sx}`);
      strict.ok(Math.abs(foo.y - sy) < 1e-9, `y ${foo.y} vs ST_Y ${sy}`);
    });
  }

  connection.end();
});
