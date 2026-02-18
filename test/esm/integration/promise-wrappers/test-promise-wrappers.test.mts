import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import {
  createPool as createPoolPromise,
  createConnection as promiseCreateConnection,
} from '../../../../promise.js';
import { config } from '../../common.test.mjs';

type TttRow = RowDataPacket & { ttt: number };
type QqqRow = RowDataPacket & { qqq: number };
type TttUuuRow = RowDataPacket & { ttt: number; uuu: string };
type CurrentUserRow = RowDataPacket & { 'current_user()': string };

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('Promise Wrappers', async () => {
  const createConnection = promiseCreateConnection;
  const createPool = createPoolPromise;

  // it's lazy exported from main index.js as well. Test that it's same function
  const mainModule = await import('../../../../index.js');

  it(() => {
    // @ts-expect-error: TODO: implement typings
    const mainExport = mainModule.default.createConnectionPromise;
    assert.equal(mainExport, createConnection);
  });

  await it('testBasic', async () => {
    const conn = await createConnection(config);
    const result1 = await conn.query<TttRow[]>('select 1+2 as ttt');
    assert.equal(result1[0][0].ttt, 3);
    const result2 = await conn.query<QqqRow[]>('select 2+2 as qqq');
    assert.equal(result2[0][0].qqq, 4);
    await conn.end();
  });

  await it('testErrors', async () => {
    const conn = await createConnection(config);
    const result1 = await conn.query<TttRow[]>('select 1+2 as ttt');
    assert.equal(result1[0][0].ttt, 3);
    try {
      await conn.query<TttRow[]>('bad sql');
      assert.fail('Expected query to fail');
    } catch {
      // expected
    } finally {
      await conn.end();
    }
  });

  await it('testObjParams', async () => {
    const conn = await createConnection(config);
    const result1 = await conn.query<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [5, 2],
    });
    assert.equal(result1[0][0].ttt, 3);
    const result2 = await conn.execute<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [8, 5],
    });
    assert.equal(result2[0][0].ttt, 3);
    await conn.end();
  });

  await it('testPrepared', async () => {
    const conn = await createConnection(config);
    const statement = await conn.prepare('select ?-? as ttt, ? as uuu');
    const result = await statement.execute([11, 3, 'test']);
    const rows = result[0] as TttUuuRow[];
    assert.equal(rows[0].ttt, 8);
    assert.equal(rows[0].uuu, 'test');
    await conn.end();
  });

  await it('testEventsConnect', async () => {
    const conn = await createConnection(config);
    let events = 0;

    const expectedListeners: Record<string, number> = {
      error: 1,
      drain: 0,
      connect: 0,
      enqueue: 0,
      end: 0,
    };
    for (const eventName in expectedListeners) {
      assert.equal(
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
          assert.equal(this, conn);
          ++events;
        }.bind(conn)
      )
      .once(
        'drain',
        function () {
          assert.equal(this, conn);
          ++events;
        }.bind(conn)
      )
      .once(
        'connect',
        function () {
          assert.equal(this, conn);
          ++events;
        }.bind(conn)
      )
      .once(
        'enqueue',
        function () {
          assert.equal(this, conn);
          ++events;
        }.bind(conn)
      )
      .once(
        'end',
        function () {
          assert.equal(this, conn);
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

    assert.equal(events, 5, 'wrong number of connection events');

    expectedListeners.error = 0;
    for (const eventName in expectedListeners) {
      assert.equal(
        // @ts-expect-error: TODO: implement typings
        conn.connection.listenerCount(eventName),
        expectedListeners[eventName],
        eventName
      );
    }

    await conn.end();
  });

  await it('testBasicPool', async () => {
    const pool = createPool(config);
    const connResolved = await pool.getConnection();
    pool.releaseConnection(connResolved);
    const result1 = await pool.query<TttRow[]>('select 1+2 as ttt');
    assert.equal(result1[0][0].ttt, 3);
    const result2 = await pool.query<QqqRow[]>('select 2+2 as qqq');
    assert.equal(result2[0][0].qqq, 4);
    await pool.end();
  });

  await it('testErrorsPool', async () => {
    const pool = createPool(config);
    const result1 = await pool.query<TttRow[]>('select 1+2 as ttt');
    assert.equal(result1[0][0].ttt, 3);
    try {
      await pool.query<TttRow[]>('bad sql');
      assert.fail('Expected query to fail');
    } catch {
      // expected
    } finally {
      await pool.end();
    }
  });

  await it('testObjParamsPool', async () => {
    const pool = createPool(config);
    const result1 = await pool.query<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [5, 2],
    });
    assert.equal(result1[0][0].ttt, 3);
    const result2 = await pool.execute<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [8, 5],
    });
    assert.equal(result2[0][0].ttt, 3);
    await pool.end();
  });

  await it('testPromiseLibrary', async () => {
    const pool = createPool(config);
    const promise = pool.execute<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [8, 5],
    });
    // @ts-expect-error: TODO: implement typings
    assert.ok(promise instanceof pool.Promise);
    await promise;
    const endPromise = pool.end();
    // @ts-expect-error: TODO: implement typings
    assert.ok(endPromise instanceof pool.Promise);
    await endPromise;
  });

  await it('testEventsPool', async () => {
    const pool = createPool(config);
    let events = 0;

    const expectedListeners: Record<string, number> = {
      acquire: 0,
      connection: 0,
      enqueue: 0,
      release: 0,
    };
    for (const eventName in expectedListeners) {
      assert.equal(
        pool.pool.listenerCount(eventName),
        expectedListeners[eventName],
        eventName
      );
    }

    pool
      .once(
        'acquire',
        function () {
          assert.equal(this, pool);
          ++events;
        }.bind(pool)
      )
      .once(
        'connection',
        function () {
          assert.equal(this, pool);
          ++events;
        }.bind(pool)
      )
      .once(
        'enqueue',
        function () {
          assert.equal(this, pool);
          ++events;
        }.bind(pool)
      )
      .once(
        'release',
        function () {
          assert.equal(this, pool);
          ++events;
        }.bind(pool)
      );

    pool.pool.emit('acquire');
    pool.pool.emit('connection');
    pool.pool.emit('enqueue');
    pool.pool.emit('release');

    assert.equal(events, 4, 'wrong number of pool connection events');

    for (const eventName in expectedListeners) {
      assert.equal(
        pool.pool.listenerCount(eventName),
        expectedListeners[eventName],
        eventName
      );
    }
  });

  await it('testChangeUser', async () => {
    const onlyUsername = function (name: string) {
      return name.substring(0, name.indexOf('@'));
    };

    const conn = await createConnection(config);
    await conn.query(
      "CREATE USER IF NOT EXISTS 'changeuser1'@'%' IDENTIFIED BY 'changeuser1pass'"
    );
    await conn.query(
      "CREATE USER IF NOT EXISTS 'changeuser2'@'%' IDENTIFIED BY 'changeuser2pass'"
    );
    await conn.query("GRANT ALL ON *.* TO 'changeuser1'@'%'");
    await conn.query("GRANT ALL ON *.* TO 'changeuser2'@'%'");
    await conn.query('FLUSH PRIVILEGES');

    await conn.changeUser({
      user: 'changeuser1',
      password: 'changeuser1pass',
    });
    const result1 = await conn.query<CurrentUserRow[]>('select current_user()');
    assert.deepEqual(
      onlyUsername(result1[0][0]['current_user()']),
      'changeuser1'
    );

    await conn.changeUser({
      user: 'changeuser2',
      password: 'changeuser2pass',
    });
    const result2 = await conn.query<CurrentUserRow[]>('select current_user()');
    assert.deepEqual(
      onlyUsername(result2[0][0]['current_user()']),
      'changeuser2'
    );

    await conn.changeUser({
      user: 'changeuser1',
      // TODO: re-enable testing passwordSha1 auth. Only works for mysql_native_password, so need to change test to create user with this auth method
      password: 'changeuser1pass',
      //passwordSha1: Buffer.from('f961d39c82138dcec42b8d0dcb3e40a14fb7e8cd', 'hex') // sha1(changeuser1pass)
    });
    const result3 = await conn.query<CurrentUserRow[]>('select current_user()');
    assert.deepEqual(
      onlyUsername(result3[0][0]['current_user()']),
      'changeuser1'
    );

    await conn.end();
  });

  await it('testConnectionProperties', async () => {
    const conn = await createConnection(config);
    assert.equal(typeof conn.config, 'object');
    assert.ok('queryFormat' in conn.config);
    assert.equal(typeof conn.threadId, 'number');
    await conn.end();
  });

  await it('testPoolConnectionDestroy', async () => {
    const options = Object.assign({ connectionLimit: 1 }, config);
    const pool = createPool(options);

    const connection = await pool.getConnection();
    connection.destroy();

    const bomb = setTimeout(() => {
      throw new Error('Timebomb not defused within 2000ms');
    }, 2000);

    await pool.getConnection();
    clearTimeout(bomb);
    await pool.end();
  });
});
