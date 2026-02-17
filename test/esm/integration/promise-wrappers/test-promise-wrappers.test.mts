import type { RowDataPacket } from '../../../../index.js';
import type { Connection } from '../../../../promise.js';
import process from 'node:process';
import { assert } from 'poku';
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

const createConnection = promiseCreateConnection;
const createPool = createPoolPromise;

// it's lazy exported from main index.js as well. Test that it's same function
const mainModule = await import('../../../../index.js');
// @ts-expect-error: TODO: implement typings
const mainExport = mainModule.default.createConnectionPromise;
assert.equal(mainExport, createConnection);

let doneCalled = false;
let exceptionCaught = false;
let doneEventsConnect = false;

let doneCalledPool = false;
let exceptionCaughtPool = false;
let doneEventsPool = false;
let doneChangeUser = false;

function testBasic() {
  let connResolved: Connection | undefined;
  createConnection(config)
    .then((conn) => {
      connResolved = conn;
      return conn.query<TttRow[]>('select 1+2 as ttt');
    })
    .then((result1) => {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved?.query<QqqRow[]>('select 2+2 as qqq');
    })
    .then((result2) => {
      assert.equal(result2?.[0][0].qqq, 4);
      return connResolved?.end();
    })
    .then(() => {
      doneCalled = true;
    })
    .catch((err) => {
      throw err;
    });
}

function testErrors() {
  let connResolved: Connection | undefined;
  const connPromise = createConnection(config);

  connPromise
    .then((conn) => {
      connResolved = conn;
      return conn.query<TttRow[]>('select 1+2 as ttt');
    })
    .then((result1) => {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved?.query<TttRow[]>('bad sql');
    })
    .then((result2) => {
      assert.equal(result2?.[0][0].ttt, 3);
      return connResolved?.query<QqqRow[]>('select 2+2 as qqq');
    })
    .catch(() => {
      exceptionCaught = true;
      if (connResolved) {
        connResolved.end();
      } else {
        console.log('Warning: promise rejected before first query');
      }
    });
}

function testObjParams() {
  let connResolved: Connection | undefined;
  createConnection(config)
    .then((conn) => {
      connResolved = conn;
      return conn.query<TttRow[]>({
        sql: 'select ?-? as ttt',
        values: [5, 2],
      });
    })
    .then((result1) => {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved?.execute<TttRow[]>({
        sql: 'select ?-? as ttt',
        values: [8, 5],
      });
    })
    .then((result2) => {
      assert.equal(result2?.[0][0].ttt, 3);
      return connResolved?.end();
    })
    .catch((err) => {
      console.log(err);
    });
}

function testPrepared() {
  let connResolved: Connection | undefined;
  createConnection(config)
    .then((conn) => {
      connResolved = conn;
      return conn.prepare('select ?-? as ttt, ? as uuu');
    })
    .then((statement) => statement.execute([11, 3, 'test']))
    .then((result) => {
      const rows = result[0] as TttUuuRow[];
      assert.equal(rows[0].ttt, 8);
      assert.equal(rows[0].uuu, 'test');
      return connResolved?.end();
    })
    .catch((err) => {
      console.log(err);
      if (connResolved) {
        connResolved.end();
      } else {
        console.log(
          'Warning: promise rejected before executing prepared statement'
        );
      }
    });
}

// REVIEW: Unused

function testEventsConnect() {
  let connResolved: Connection | undefined;
  createConnection(config)
    .then((conn) => {
      connResolved = conn;
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

            doneEventsConnect = events === 5;
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

      expectedListeners.error = 0;
      for (const eventName in expectedListeners) {
        assert.equal(
          // @ts-expect-error: TODO: implement typings
          conn.connection.listenerCount(eventName),
          expectedListeners[eventName],
          eventName
        );
      }

      conn.end();
    })
    .catch((err) => {
      console.log(err);
      if (connResolved) {
        connResolved.end();
      } else {
        console.log(
          'Warning: promise rejected before executing prepared statement'
        );
      }
    });
}

function testBasicPool() {
  const pool = createPool(config);

  pool
    .getConnection()
    .then((connResolved) => {
      pool.releaseConnection(connResolved);
      return pool.query<TttRow[]>('select 1+2 as ttt');
    })
    .then((result1) => {
      assert.equal(result1[0][0].ttt, 3);
      return pool.query<QqqRow[]>('select 2+2 as qqq');
    })
    .then((result2) => {
      assert.equal(result2[0][0].qqq, 4);
      return pool.end();
    })
    .then(() => {
      doneCalledPool = true;
    })
    .catch((err) => {
      throw err;
    });
}

function testErrorsPool() {
  const pool = createPool(config);
  pool
    .query<TttRow[]>('select 1+2 as ttt')
    .then((result1) => {
      assert.equal(result1[0][0].ttt, 3);
      return pool.query<TttRow[]>('bad sql');
    })
    .then((result2) => {
      assert.equal(result2[0][0].ttt, 3);
      return pool.query<QqqRow[]>('select 2+2 as qqq');
    })
    .catch(() => {
      exceptionCaughtPool = true;
      return pool.end();
    });
}

function testObjParamsPool() {
  const pool = createPool(config);
  pool
    .query<TttRow[]>({
      sql: 'select ?-? as ttt',
      values: [5, 2],
    })
    .then((result1) => {
      assert.equal(result1[0][0].ttt, 3);
      return pool.execute<TttRow[]>({
        sql: 'select ?-? as ttt',
        values: [8, 5],
      });
    })
    .then((result2) => {
      assert.equal(result2[0][0].ttt, 3);
      return pool.end();
    })
    .catch((err) => {
      console.log(err);
    });
}
function testPromiseLibrary() {
  const pool = createPool(config);
  let promise: Promise<unknown> = pool.execute<TttRow[]>({
    sql: 'select ?-? as ttt',
    values: [8, 5],
  });
  promise
    .then(() => {
      // @ts-expect-error: TODO: implement typings
      assert.ok(promise instanceof pool.Promise);
    })
    .then(() => {
      promise = pool.end();
      // @ts-expect-error: TODO: implement typings
      assert.ok(promise instanceof pool.Promise);
    })
    .catch((err) => {
      console.log(err);
    });
}

function testEventsPool() {
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

        doneEventsPool = events === 4;
      }.bind(pool)
    );

  pool.pool.emit('acquire');
  pool.pool.emit('connection');
  pool.pool.emit('enqueue');
  pool.pool.emit('release');

  for (const eventName in expectedListeners) {
    assert.equal(
      pool.pool.listenerCount(eventName),
      expectedListeners[eventName],
      eventName
    );
  }
}

function testChangeUser() {
  const onlyUsername = function (name: string) {
    return name.substring(0, name.indexOf('@'));
  };
  let connResolved: Connection | undefined;

  createConnection(config)
    .then((conn) => {
      connResolved = conn;
      return connResolved.query(
        "CREATE USER IF NOT EXISTS 'changeuser1'@'%' IDENTIFIED BY 'changeuser1pass'"
      );
    })
    .then(() => {
      connResolved?.query(
        "CREATE USER IF NOT EXISTS 'changeuser2'@'%' IDENTIFIED BY 'changeuser2pass'"
      );
      connResolved?.query("GRANT ALL ON *.* TO 'changeuser1'@'%'");
      connResolved?.query("GRANT ALL ON *.* TO 'changeuser2'@'%'");
      return connResolved?.query('FLUSH PRIVILEGES');
    })
    .then(() => {
      connResolved?.changeUser({
        user: 'changeuser1',
        password: 'changeuser1pass',
      });
    })
    .then(() => connResolved?.query<CurrentUserRow[]>('select current_user()'))
    .then((result) => {
      const rows = result?.[0];
      assert.deepEqual(
        onlyUsername(rows?.[0]['current_user()'] ?? ''),
        'changeuser1'
      );
      return connResolved?.changeUser({
        user: 'changeuser2',
        password: 'changeuser2pass',
      });
    })
    .then(() => connResolved?.query<CurrentUserRow[]>('select current_user()'))
    .then((result) => {
      const rows = result?.[0];
      assert.deepEqual(
        onlyUsername(rows?.[0]['current_user()'] ?? ''),
        'changeuser2'
      );
      return connResolved?.changeUser({
        user: 'changeuser1',
        // TODO: re-enable testing passwordSha1 auth. Only works for mysql_native_password, so need to change test to create user with this auth method
        password: 'changeuser1pass',
        //passwordSha1: Buffer.from('f961d39c82138dcec42b8d0dcb3e40a14fb7e8cd', 'hex') // sha1(changeuser1pass)
      });
    })
    .then(() => connResolved?.query<CurrentUserRow[]>('select current_user()'))
    .then((result) => {
      const rows = result?.[0];
      assert.deepEqual(
        onlyUsername(rows?.[0]['current_user()'] ?? ''),
        'changeuser1'
      );
      doneChangeUser = true;
      return connResolved?.end();
    })
    .catch((err) => {
      console.log(err);
      if (connResolved) {
        connResolved.end();
      }
      throw err;
    });
}

function testConnectionProperties() {
  let connResolved: Connection | undefined;
  createConnection(config)
    .then((conn) => {
      connResolved = conn;
      assert.equal(typeof conn.config, 'object');
      assert.ok('queryFormat' in conn.config);
      assert.equal(typeof conn.threadId, 'number');
      return connResolved.end();
    })
    .catch((err) => {
      if (connResolved) {
        connResolved.end();
      }
      throw err;
    });
}

function timebomb(fuse: number) {
  let timebomb: ReturnType<typeof setTimeout> | undefined;

  return {
    arm() {
      timebomb = setTimeout(() => {
        throw new Error(`Timebomb not defused within ${fuse}ms`);
      }, fuse);
    },
    defuse() {
      clearTimeout(timebomb);
    },
  };
}

function testPoolConnectionDestroy() {
  // Only allow one connection
  const options = Object.assign({ connectionLimit: 1 }, config);
  const pool = createPool(options);

  const bomb = timebomb(2000);

  pool
    .getConnection()
    .then((connection) => connection.destroy())
    .then(bomb.arm)
    .then(() => pool.getConnection())
    .then(bomb.defuse)
    .then(() => pool.end());
}

testBasic();
testErrors();
testObjParams();
testPrepared();
testEventsConnect();
testBasicPool();
testErrorsPool();
testObjParamsPool();
testEventsPool();
testChangeUser();
testConnectionProperties();
testPoolConnectionDestroy();
testPromiseLibrary();

process.on('exit', () => {
  assert.equal(doneCalled, true, 'done not called');
  assert.equal(exceptionCaught, true, 'exception not caught');
  assert.equal(doneEventsConnect, true, 'wrong number of connection events');
  assert.equal(doneCalledPool, true, 'pool done not called');
  assert.equal(exceptionCaughtPool, true, 'pool exception not caught');
  assert.equal(doneEventsPool, true, 'wrong number of pool connection events');
  assert.equal(doneChangeUser, true, 'user not changed');
});

process.on('unhandledRejection', (err) => {
  console.log('error:', (err as Error).stack);
});
