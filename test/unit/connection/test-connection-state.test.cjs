'use strict';
const { assert, describe, it, beforeEach, afterEach } = require('poku');
const common = require('../../common.test.cjs');

(async () => {
  await describe('Connection state', async () => {
    let connection;

    beforeEach(() => (connection = common.createConnection().promise()));

    afterEach(async () => {
      if (!connection) return;
      try {
        await connection.end();
      } catch (e) {
        // ignore teardown errors
      }
    });

    await it('connects and sets state to connected', async () => {
      await connection?.connect();
      assert.equal(connection.connection.state, 'connected');
    });

    await it('connects and disconnect: sets state to connected and disconnected close() is called.', async () => {
      await connection?.connect();
      assert.equal(connection.connection.state, 'connected');
      await connection.close();
      assert.equal(connection.connection.state, 'disconnected');
    });

    await it('connects and disconnect: sets state to connected and disconnected when end() is called.', async () => {
      await connection?.connect();
      assert.equal(connection.connection.state, 'connected');
      await connection.end();
      assert.equal(connection.connection.state, 'disconnected');
    });

    await it('state is protocol_error if creds are wrong.', async () => {
      const badConnection = common.createConnection({ password: "WR0NG", user: 'wrong' }).promise();
      try {
        await badConnection.connect();
        assert.fail('expected connect() to throw for bad credentials');
      } catch (err) {
        assert.equal(badConnection.connection.state, 'protocol_error');
      } finally {
        try {
          await bad.end();
        } catch (e) { }
      }
    });

    await it('ping keeps connection operational', async () => {
      await connection?.connect();
      await connection.ping();
      assert.equal(connection.connection.state, 'connected');
    });

    await it('simple query keeps state operational and returns rows', async () => {
      await connection?.connect();
      const [rows] = await connection.query('SELECT 1 AS x');
      assert.equal(rows[0].x, 1);
      assert.equal(connection.connection.state, 'connected');
    });

    await it('socket destroy produces disconnected', async () => {
      await connection?.connect();
      const raw = connection.connection;
      // attach error listener early to avoid uncaught exceptions
      let sawError = null;
      raw.once('error', (e) => { sawError = e; });
      // Force a network-style drop
      raw.stream.destroy(new Error('simulate network drop'));
      // wait a bit for event propagation
      await new Promise((r) => setTimeout(r, 50));
      assert.ok(sawError instanceof Error, 'expected an error emitted');
      assert.equal(connection.connection.state, 'disconnected');
    });

    await it('changeUser to invalid account yields disconnected', async () => {
      await connection?.connect();
      const raw = connection.connection;
      // use changeUser to induce auth error (assuming user 'nope' doesn't exist)
      let gotErr = null;
      assert.equal(raw.state, "connected");
      raw.on('error', (e) => { gotErr = e; });
      try {
        await connection.changeUser({ user: 'nope', password: 'bad' });
      } catch (err) {
        gotErr = err;
      }
      // allow propagation
      await new Promise((r) => setTimeout(r, 20));
      assert.ok(gotErr instanceof Error, 'expected changeUser to emit error');
      assert.equal(raw.state, 'disconnected');
    });
  });
})();
