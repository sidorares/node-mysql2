import type { Connection, RowDataPacket } from '../../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type Counters = { prepared: number; closed: number };

const readCounters = async (connection: Connection): Promise<Counters> => {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SHOW SESSION STATUS WHERE Variable_name IN ('Com_stmt_prepare', 'Com_stmt_close')"
  );
  const value = (name: string) =>
    Number(rows.find((row) => row.Variable_name === name)?.Value);

  return {
    prepared: value('Com_stmt_prepare'),
    closed: value('Com_stmt_close'),
  };
};

const executeEach = async (connection: Connection, ids: number[]) => {
  for (const id of ids) {
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT ${id} AS id`
    );
    strict.deepEqual(rows, [{ id }]);
  }
};

const range = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, index) => from + index);

await describe('Statement cache: default limit keeps statements past the initial capacity', async () => {
  const base = createConnection();
  const connection = base.promise();
  const before = await readCounters(connection);

  await executeEach(connection, range(0, 40));
  await executeEach(connection, range(0, 40));
  const after = await readCounters(connection);

  it('prepares each statement once and closes none', () => {
    strict.equal(after.prepared - before.prepared, 40);
    strict.equal(after.closed - before.closed, 0);
    // @ts-expect-error: internal access
    strict.equal(base._statements.size, 40);
  });

  await connection.end();
});

await describe('Statement cache: closes the least recently used statement at maxPreparedStatements', async () => {
  const base = createConnection({ maxPreparedStatements: 20 });
  const connection = base.promise();
  const before = await readCounters(connection);

  await executeEach(connection, range(0, 25));
  const filled = await readCounters(connection);

  await executeEach(connection, [24]);
  const cachedHit = await readCounters(connection);

  await executeEach(connection, [0]);
  const evictedMiss = await readCounters(connection);

  it('closes only the statements beyond the limit', () => {
    strict.equal(filled.prepared - before.prepared, 25);
    strict.equal(filled.closed - before.closed, 5);
    // @ts-expect-error: internal access
    strict.equal(base._statements.size, 20);
  });

  it('reuses a cached statement without preparing it again', () => {
    strict.equal(cachedHit.prepared, filled.prepared);
    strict.equal(cachedHit.closed, filled.closed);
  });

  it('prepares an evicted statement again and evicts the next oldest', () => {
    strict.equal(evictedMiss.prepared - cachedHit.prepared, 1);
    strict.equal(evictedMiss.closed - cachedHit.closed, 1);
  });

  await connection.end();
});
