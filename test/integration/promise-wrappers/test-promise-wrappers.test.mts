import type { RowDataPacket } from '../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import {
  createPool as createPoolPromise,
  createConnection as promiseCreateConnection,
} from '../../../promise.js';
import { config } from '../../common.test.mjs';

type TttRow = RowDataPacket & { ttt: number };
type QqqRow = RowDataPacket & { qqq: number };
type TttUuuRow = RowDataPacket & { ttt: number; uuu: string };

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

const createConnection = promiseCreateConnection;
const createPool = createPoolPromise;

await describe('Promise Wrappers', async () => {
  // it's lazy exported from main index.js as well. Test that it's same function
  const mainModule = await import('../../../index.js');

  it(() => {
    // @ts-expect-error: TODO: implement typings
    const mainExport = mainModule.default.createConnectionPromise;
    strict.equal(mainExport, createConnection);
  });
});

await describe('testBasic', async () => {
  const conn = await createConnection(config);

  await it(async () => {
    const result1 = await conn.query<TttRow[]>('select 1+2 as ttt');
    strict.equal(result1[0][0].ttt, 3);
    const result2 = await conn.query<QqqRow[]>('select 2+2 as qqq');
    strict.equal(result2[0][0].qqq, 4);
  });

  await conn.end();
});

await describe('testErrors', async () => {
  const conn = await createConnection(config);

  await it(async () => {
    const result1 = await conn.query<TttRow[]>('select 1+2 as ttt');
    strict.equal(result1[0][0].ttt, 3);
    let threw = false;
    try {
      await conn.query<TttRow[]>('bad sql');
    } catch {
      threw = true;
    }
    strict(threw, 'Expected query to fail');
  });

  await conn.end();
});

await describe('testObjParams', async () => {
  const conn = await createConnection(config);

  await it(async () => {
    const result1 = await conn.query<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [5, 2],
    });
    strict.equal(result1[0][0].ttt, 3);
    const result2 = await conn.execute<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [8, 5],
    });
    strict.equal(result2[0][0].ttt, 3);
  });

  await conn.end();
});

await describe('testPrepared', async () => {
  const conn = await createConnection(config);

  await it(async () => {
    const statement = await conn.prepare('select ?-? as ttt, ? as uuu');
    const result = await statement.execute([11, 3, 'test']);
    const rows = result[0] as TttUuuRow[];
    strict.equal(rows[0].ttt, 8);
    strict.equal(rows[0].uuu, 'test');
  });

  await conn.end();
});

await describe('testEventsConnect', async () => {
  const conn = await createConnection(config);

  await it(async () => {
    let events = 0;

    const expectedListeners: Record<string, number> = {
      error: 1,
      drain: 0,
      connect: 0,
      enqueue: 0,
      end: 0,
    };
    for (const eventName in expectedListeners) {
      strict.equal(
        // @ts-expect-error: TODO: implement typings
        conn.connection.listenerCount(eventName),
        expectedListeners[eventName],
        eventName
      );
    }

    conn
      .once(
        'error',
        function () {
          strict.equal(this, conn);
          ++events;
        }.bind(conn)
      )
      .once(
        'drain',
        function () {
          strict.equal(this, conn);
          ++events;
        }.bind(conn)
      )
      .once(
        'connect',
        function () {
          strict.equal(this, conn);
          ++events;
        }.bind(conn)
      )
      .once(
        'enqueue',
        function () {
          strict.equal(this, conn);
          ++events;
        }.bind(conn)
      )
      .once(
        'end',
        function () {
          strict.equal(this, conn);
          ++events;
        }.bind(conn)
      );

    // @ts-expect-error: TODO: implement typings
    conn.connection.emit('error', new Error());
    // @ts-expect-error: TODO: implement typings
    conn.connection.emit('drain');
    // @ts-expect-error: TODO: implement typings
    conn.connection.emit('connect');
    // @ts-expect-error: TODO: implement typings
    conn.connection.emit('enqueue');
    // @ts-expect-error: TODO: implement typings
    conn.connection.emit('end');

    strict.equal(events, 5, 'wrong number of connection events');

    expectedListeners.error = 0;
    for (const eventName in expectedListeners) {
      strict.equal(
        // @ts-expect-error: TODO: implement typings
        conn.connection.listenerCount(eventName),
        expectedListeners[eventName],
        eventName
      );
    }
  });

  await conn.end();
});

await describe('testBasicPool', async () => {
  const pool = createPool(config);

  await it(async () => {
    const connResolved = await pool.getConnection();
    pool.releaseConnection(connResolved);
    const result1 = await pool.query<TttRow[]>('select 1+2 as ttt');
    strict.equal(result1[0][0].ttt, 3);
    const result2 = await pool.query<QqqRow[]>('select 2+2 as qqq');
    strict.equal(result2[0][0].qqq, 4);
  });

  await pool.end();
});

await describe('testErrorsPool', async () => {
  const pool = createPool(config);

  await it(async () => {
    const result1 = await pool.query<TttRow[]>('select 1+2 as ttt');
    strict.equal(result1[0][0].ttt, 3);
    let threw = false;
    try {
      await pool.query<TttRow[]>('bad sql');
    } catch {
      threw = true;
    }
    strict(threw, 'Expected query to fail');
  });

  await pool.end();
});

await describe('testObjParamsPool', async () => {
  const pool = createPool(config);

  await it(async () => {
    const result1 = await pool.query<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [5, 2],
    });
    strict.equal(result1[0][0].ttt, 3);
    const result2 = await pool.execute<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [8, 5],
    });
    strict.equal(result2[0][0].ttt, 3);
  });

  await pool.end();
});

await describe('testPromiseLibrary', async () => {
  const pool = createPool(config);

  await it(async () => {
    const promise = pool.execute<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [8, 5],
    });
    // @ts-expect-error: TODO: implement typings
    strict.ok(promise instanceof pool.Promise);
    await promise;
    const endPromise = pool.end();
    // @ts-expect-error: TODO: implement typings
    strict.ok(endPromise instanceof pool.Promise);
    await endPromise;
  });
});

await describe('testEventsPool', async () => {
  const pool = createPool(config);

  await it(async () => {
    let events = 0;

    const expectedListeners: Record<string, number> = {
      acquire: 0,
      connection: 0,
      enqueue: 0,
      release: 0,
    };
    for (const eventName in expectedListeners) {
      strict.equal(
        pool.pool.listenerCount(eventName),
        expectedListeners[eventName],
        eventName
      );
    }

    pool
      .once(
        'acquire',
        function () {
          strict.equal(this, pool);
          ++events;
        }.bind(pool)
      )
      .once(
        'connection',
        function () {
          strict.equal(this, pool);
          ++events;
        }.bind(pool)
      )
      .once(
        'enqueue',
        function () {
          strict.equal(this, pool);
          ++events;
        }.bind(pool)
      )
      .once(
        'release',
        function () {
          strict.equal(this, pool);
          ++events;
        }.bind(pool)
      );

    pool.pool.emit('acquire');
    pool.pool.emit('connection');
    pool.pool.emit('enqueue');
    pool.pool.emit('release');

    strict.equal(events, 4, 'wrong number of pool connection events');

    for (const eventName in expectedListeners) {
      strict.equal(
        pool.pool.listenerCount(eventName),
        expectedListeners[eventName],
        eventName
      );
    }
  });

  await pool.end();
});

await describe('testConnectionProperties', async () => {
  const conn = await createConnection(config);

  await it(async () => {
    strict.equal(typeof conn.config, 'object');
    strict.ok('queryFormat' in conn.config);
    strict.equal(typeof conn.threadId, 'number');
  });

  await conn.end();
});

await describe('testPoolConnectionDestroy', async () => {
  const options = Object.assign({ connectionLimit: 1 }, config);
  const pool = createPool(options);

  await it(async () => {
    const connection = await pool.getConnection();
    connection.destroy();

    const bomb = setTimeout(() => {
      throw new Error('Timebomb not defused within 2000ms');
    }, 2000);

    await pool.getConnection();
    clearTimeout(bomb);
  });

  await pool.end();
});
