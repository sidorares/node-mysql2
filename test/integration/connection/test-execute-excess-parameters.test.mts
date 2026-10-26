import type { PrepareStatementInfo, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type ValuesRow = RowDataPacket & {
  a: string | null;
  b: string | null;
  c: string | null;
};

function localArityError(error: unknown): boolean {
  return (
    error instanceof RangeError &&
    error.message ===
      'Too many bind parameters: expected at most 3, received 4' &&
    !('errno' in error) &&
    !('sqlState' in error)
  );
}

await describe('Execute excess positional parameters', async () => {
  const connection = createConnection();
  const promise = connection.promise();
  await promise.query(
    'CREATE TEMPORARY TABLE mysql2_excess_arity (fixture VARCHAR(20) PRIMARY KEY, a VARCHAR(100), b VARCHAR(100), c VARCHAR(100))'
  );
  await promise.query(
    "INSERT INTO mysql2_excess_arity VALUES ('target','sentinel','sentinel','sentinel'),('other','sentinel','sentinel','sentinel')"
  );
  const sql =
    "UPDATE mysql2_excess_arity SET a=?,b=?,c=? WHERE fixture='target'";
  const read = () =>
    promise.query<ValuesRow[]>(
      'SELECT a,b,c FROM mysql2_excess_arity ORDER BY fixture'
    );

  await it('keeps valid, cached excess and subsequent valid calls separate', async () => {
    await promise.execute(sql, [27, 28, 29]);
    const [before] = await read();
    strict.deepEqual(before, [
      { a: 'sentinel', b: 'sentinel', c: 'sentinel' },
      { a: '27', b: '28', c: '29' },
    ]);
    await strict.rejects(
      promise.execute(sql, [27, 28, 29, 30]),
      localArityError
    );
    strict.deepEqual((await read())[0], before);
    await promise.execute(sql, [31, 32, 33]);
    strict.deepEqual((await read())[0][1], { a: '31', b: '32', c: '33' });
  });

  await it('rejects excess on the first execution without a row change', async () => {
    const firstSql = `${sql} /* first execution */`;
    const [before] = await read();
    await strict.rejects(
      promise.execute(firstSql, [27, 28, 29, 30]),
      localArityError
    );
    strict.deepEqual((await read())[0], before);
    await promise.execute(firstSql, [27, 28, 29]);
    strict.deepEqual((await read())[0][1], { a: '27', b: '28', c: '29' });
  });

  await it('settles a callback once, clears its timer and advances queued work', async () => {
    const blocker = promise.query('SELECT 1');
    let calls = 0;
    let ends = 0;
    let command: ReturnType<typeof connection.execute>;
    const failure = new Promise<Error | null>((resolve) => {
      command = connection.execute(
        { sql, timeout: 60000 },
        [27, 28, 29, 30],
        (error) => {
          calls++;
          resolve(error);
        }
      );
      command.on('end', () => ends++);
    });
    const queued = promise.execute(sql, [41, 42, 43]);
    await blocker;
    strict(localArityError(await failure));
    await queued;
    strict.equal(calls, 1);
    strict.equal(ends, 1);
    // @ts-expect-error: internal access
    strict.equal(command.queryTimeout, null);
    strict.deepEqual((await read())[0][1], { a: '41', b: '42', c: '43' });
  });

  await describe('Explicitly prepared callback statement', async () => {
    const stmt = await new Promise<PrepareStatementInfo>((resolve, reject) => {
      connection.prepare(`${sql} /* manual callback */`, (error, statement) => {
        if (error) reject(error);
        else resolve(statement);
      });
    });
    await it('protects explicitly prepared callback execution and reuse', async () => {
      const [before] = await read();
      let calls = 0;
      const failure = await new Promise<Error | null>((resolve) => {
        stmt.execute([27, 28, 29, 30], (error) => {
          calls++;
          resolve(error);
        });
      });
      strict(localArityError(failure));
      strict.equal(calls, 1);
      strict.deepEqual((await read())[0], before);
      await new Promise<void>((resolve, reject) => {
        stmt.execute([51, 52, 53], (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      strict.deepEqual((await read())[0][1], { a: '51', b: '52', c: '53' });
    });
    stmt.close();
  });

  await describe('Explicitly prepared promise statement', async () => {
    const stmt = await promise.prepare(`${sql} /* manual promise */`);
    await it('protects explicitly prepared promise execution and reuse', async () => {
      const [before] = await read();
      await strict.rejects(stmt.execute([27, 28, 29, 30]), localArityError);
      strict.deepEqual((await read())[0], before);
      await stmt.execute([61, 62, 63]);
      strict.deepEqual((await read())[0][1], { a: '61', b: '62', c: '63' });
    });
    await stmt.close();
  });

  await it('uses server metadata for zero binds and literal/comment question marks', async () => {
    const zero = "SELECT '?' AS marker /* ? */";
    strict.deepEqual((await promise.execute<RowDataPacket[]>(zero, []))[0], [
      { marker: '?' },
    ]);
    await strict.rejects(promise.execute(zero, [1]), {
      name: 'RangeError',
      message: 'Too many bind parameters: expected at most 0, received 1',
    });
    strict.deepEqual((await promise.execute<RowDataPacket[]>(zero, []))[0], [
      { marker: '?' },
    ]);
    const literal = "SELECT ? AS value, '?' AS marker /* ? */";
    strict.deepEqual(
      (await promise.execute<RowDataPacket[]>(literal, [7]))[0],
      [{ value: 7, marker: '?' }]
    );
    await strict.rejects(promise.execute(literal, [7, 8]), {
      name: 'RangeError',
      message: 'Too many bind parameters: expected at most 1, received 2',
    });
  });

  await it('preserves NULL, zero, false, empty values and vanilla undefined policy', async () => {
    const q =
      'SELECT ? AS nilValue, ? AS zeroValue, ? AS falseValue, ? AS emptyValue';
    strict.deepEqual(
      (await promise.execute<RowDataPacket[]>(q, [null, 0, false, '']))[0],
      [{ nilValue: null, zeroValue: 0, falseValue: 0, emptyValue: '' }]
    );
    await strict.rejects(
      Reflect.apply(promise.execute, promise, [
        'SELECT ? AS value',
        [undefined],
      ]),
      TypeError
    );
    strict.deepEqual(
      (await promise.execute<RowDataPacket[]>('SELECT ? AS value', [9]))[0],
      [{ value: 9 }]
    );
  });

  await promise.end();
});

await describe('Named placeholder normalization before excess validation', async () => {
  const connection = createConnection({ namedPlaceholders: true }).promise();
  await it('validates the normalized positional parameters', async () => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT :value AS value',
      { value: 7 }
    );
    strict.deepEqual(rows, [{ value: 7 }]);
  });
  await connection.end();
});
