import type { QueryError, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type ValueRow = RowDataPacket & { v: number | string };
type HexRow = RowDataPacket & { h: string };

const settle = <T,>(promises: Promise<T>[]) => Promise.allSettled(promises);

const firstValue = (rows: unknown) => Number((rows as ValueRow[])[0].v);

const valueOrErrorCode = (result: Promise<[unknown, unknown]>) =>
  result.then(
    ([rows]) => firstValue(rows),
    (error: QueryError) => error.code
  );

await describe('Pipelining: results and errors stay with their callers', async () => {
  const db = createConnection({ pipelining: 32 }).promise();

  await it('resolves each of 300 mixed commands with its own result', async () => {
    const outcomes = await settle(
      Array.from({ length: 300 }, (_, i) => {
        if (i % 7 === 3) {
          return db.query<ValueRow[]>('SELECT * FROM no_such_table_pipelining');
        }
        return i % 2
          ? db.execute<ValueRow[]>('SELECT ? AS v', [i])
          : db.query<ValueRow[]>('SELECT ? AS v', [i]);
      })
    );

    outcomes.forEach((outcome, i) => {
      if (i % 7 === 3) {
        strict.equal(outcome.status, 'rejected');
        return;
      }
      strict.equal(outcome.status, 'fulfilled');
      if (outcome.status === 'fulfilled') {
        strict.equal(Number(outcome.value[0][0].v), i);
      }
    });
  });

  await db.end();
});

await describe('Pipelining: session changes in flight behave as without it', async () => {
  const pipelined = createConnection({ pipelining: 32 }).promise();
  const sequential = createConnection({ pipelining: false }).promise();

  await it('encodes values for a SET NAMES sent just before', async () => {
    const [, [viaQuery], [viaExecute]] = await Promise.all([
      pipelined.query('SET NAMES latin1'),
      pipelined.query<HexRow[]>('SELECT HEX(?) AS h', ['é']),
      pipelined.execute<HexRow[]>('SELECT HEX(CAST(? AS CHAR)) AS h', ['é']),
    ]);

    await sequential.query('SET NAMES latin1');
    const [expectedQuery] = await sequential.query<HexRow[]>(
      'SELECT HEX(?) AS h',
      ['é']
    );
    const [expectedExecute] = await sequential.execute<HexRow[]>(
      'SELECT HEX(CAST(? AS CHAR)) AS h',
      ['é']
    );

    strict.equal(viaQuery[0].h, expectedQuery[0].h);
    strict.equal(viaExecute[0].h, expectedExecute[0].h);
  });

  await it('escapes values for an sql_mode set just before', async () => {
    const value = "C:\\dir\\ it's";
    const [, [rows]] = await Promise.all([
      pipelined.query(
        "SET SESSION sql_mode = CONCAT(@@SESSION.sql_mode, ',NO_BACKSLASH_ESCAPES')"
      ),
      pipelined.query<ValueRow[]>('SELECT ? AS v', [value]),
    ]);

    strict.equal(rows[0].v, value);
  });

  await pipelined.end();
  await sequential.end();
});

await describe('Pipelining: statements of a transaction are not pipelined', async () => {
  const admin = createConnection().promise();
  await admin.query('DROP TABLE IF EXISTS test_pipelining_tx');
  await admin.query('CREATE TABLE test_pipelining_tx (id INT PRIMARY KEY)');

  const connection = createConnection({ pipelining: 32 });
  connection.on('error', () => {});
  const run = (sql: string, onError?: () => void) =>
    new Promise<void>((resolve) =>
      connection.query(sql, (err: QueryError | null) => {
        if (err && onError) {
          onError();
        }
        resolve();
      })
    );

  await it('stops at a failed statement when the caller destroys the connection', async () => {
    await Promise.all([
      run('BEGIN'),
      run('INSERT INTO test_pipelining_tx VALUES (1)'),
      run('INSERT INTO test_pipelining_tx VALUES (1)', () =>
        connection.destroy()
      ),
      run('INSERT INTO test_pipelining_tx VALUES (2)'),
      run('COMMIT'),
    ]);
    const [rows] = await admin.query<RowDataPacket[]>(
      'SELECT id FROM test_pipelining_tx'
    );

    strict.deepEqual(rows, []);
  });

  connection.destroy();
  await admin.query('DROP TABLE IF EXISTS test_pipelining_tx');
  await admin.end();
});

await describe('Pipelining: one statement prepared twice at once', async () => {
  const db = createConnection({ pipelining: 32 }).promise();

  await it('gives both callers a working statement', async () => {
    const [, first, second] = await Promise.all([
      db.query('SELECT 1'),
      db.prepare('SELECT ? + 1 AS v'),
      db.prepare('SELECT ? + 1 AS v'),
    ]);
    strict.equal(await valueOrErrorCode(first.execute([1])), 2);
    strict.equal(await valueOrErrorCode(second.execute([2])), 3);
  });

  await it('keeps a prepared handle working next to execute() of the same SQL', async () => {
    const [, statement, [viaExecute]] = await Promise.all([
      db.query('SELECT 1'),
      db.prepare('SELECT ? + 10 AS v'),
      db.execute<ValueRow[]>('SELECT ? + 10 AS v', [1]),
    ]);
    strict.equal(firstValue(viaExecute), 11);
    strict.equal(await valueOrErrorCode(statement.execute([2])), 12);
  });

  await db.end();
});

await describe('Pipelining: a callback that adds commands', async () => {
  const connection = createConnection({ pipelining: 32 });
  await connection.promise().prepare('SELECT ? AS v');

  await it('runs once when a cached prepare completes inside the pipeline', async () => {
    let calls = 0;
    const executed = await new Promise<unknown>((resolve) => {
      connection.query('SELECT 1', () => {});
      connection.prepare('SELECT ? AS v', (err, statement) => {
        calls++;
        if (err || calls > 1) {
          resolve(err);
          return;
        }
        statement.execute([7], (executeError, rows) =>
          resolve(executeError || rows)
        );
      });
    });

    strict.equal(calls, 1);
    strict.equal(firstValue(executed), 7);
  });

  await connection.promise().end();
});

await describe('Pipelining: a queued command that fails before it is sent', async () => {
  const connection = createConnection({ pipelining: 32 });
  const db = connection.promise();
  await db.execute('SELECT ? AS v', [1]);

  await it('reports to listeners attached after the call and keeps the connection', async () => {
    const before = db.query('SELECT 1 AS v');
    const events: string[] = [];
    const failing = connection.execute('SELECT ? AS v', [1, 2]);
    failing.on('error', (error) => events.push(error.constructor.name));
    failing.on('end', () => events.push('end'));
    const after = db.execute('SELECT ? AS v', [3]);

    strict.deepEqual(
      await Promise.all([valueOrErrorCode(before), valueOrErrorCode(after)]),
      [1, 3]
    );
    strict.deepEqual(events, ['RangeError', 'end']);
  });

  connection.destroy();
});

await describe('Pipelining: LOAD DATA LOCAL', async () => {
  const db = createConnection({ pipelining: 32 }).promise();
  await db.query('CREATE TEMPORARY TABLE test_pipelining_infile (a INT)');

  await it('is refused without disturbing the commands around it', async () => {
    const outcomes = await settle([
      db.query<ValueRow[]>('SELECT 1 AS v'),
      db.query(
        "LOAD DATA LOCAL INFILE 'pipelining.csv' INTO TABLE test_pipelining_infile"
      ),
      db.query<ValueRow[]>('SELECT 2 AS v'),
    ]);

    strict.deepEqual(
      outcomes.map((outcome) => outcome.status),
      ['fulfilled', 'rejected', 'fulfilled']
    );
  });

  await db.end();
});

await describe('Pipelining: destroy() with commands in flight', async () => {
  const connection = createConnection({ pipelining: 32 });
  connection.on('error', () => {});
  await connection.promise().query('SELECT 1');

  await it('settles every command', async () => {
    const pending = Array.from({ length: 40 }, (_, i) =>
      connection.promise().query('SELECT ? AS v', [i])
    );
    connection.destroy();
    const outcomes = await settle(pending);

    strict.equal(outcomes.length, 40);
  });

  connection.destroy();
});
