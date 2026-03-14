import type {
  ConnectTraceContext,
  ExecuteTraceContext,
  PoolConnectTraceContext,
  QueryTraceContext,
} from '../../lib/tracing.js';
import type { RowDataPacket } from '../../promise.js';
import diagnostics_channel from 'node:diagnostics_channel';
import { assert, describe, it, skip } from 'poku';
import { config, createConnection, createPool } from '../common.test.mjs';

const hasTracingChannel =
  typeof diagnostics_channel.tracingChannel === 'function';

if (!hasTracingChannel) {
  skip('TracingChannel requires Node 19.9+ / 20+');
}

interface TraceEvent<T> {
  type: string;
  ctx: T;
}

function collectEvents<T>(events: TraceEvent<T>[]) {
  return {
    start(ctx: object) {
      events.push({ type: 'start', ctx: ctx as T });
    },
    end(ctx: object) {
      events.push({ type: 'end', ctx: ctx as T });
    },
    asyncStart(ctx: object) {
      events.push({ type: 'asyncStart', ctx: ctx as T });
    },
    asyncEnd(ctx: object) {
      events.push({ type: 'asyncEnd', ctx: ctx as T });
    },
    error(ctx: object) {
      events.push({ type: 'error', ctx: ctx as T });
    },
  };
}

function assertEvent<T>(events: TraceEvent<T>[], type: string): TraceEvent<T> {
  const event = events.find((e) => e.type === type);
  if (!event) {
    throw new Error(`expected '${type}' event to fire`);
  }
  return event;
}

describe('TracingChannel', () => {
  describe('mysql2:query', () => {
    it('should trace a successful query with callback', async () => {
      const events: TraceEvent<QueryTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel.tracingChannel('mysql2:query').subscribe(subscribers);
      try {
        const conn = createConnection();
        await new Promise<void>((resolve, reject) => {
          conn.query(
            'SELECT 1 + 1 AS result',
            (err: Error | null, results: RowDataPacket[]) => {
              if (err) return reject(err);
              assert.strictEqual(results[0].result, 2);
              resolve();
            }
          );
        });
        conn.end();

        const start = assertEvent(events, 'start');
        assert(
          start.ctx.query.includes('SELECT 1 + 1'),
          'should have query text'
        );
        assert.strictEqual(start.ctx.database, config.database);
        assert.strictEqual(start.ctx.serverAddress, config.host || 'localhost');
        assert.strictEqual(start.ctx.serverPort, config.port || 3306);

        assertEvent(events, 'asyncEnd');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:query')
          .unsubscribe(subscribers);
      }
    });

    it('should trace a failed query', async () => {
      const events: TraceEvent<QueryTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel.tracingChannel('mysql2:query').subscribe(subscribers);
      try {
        const conn = createConnection();
        await new Promise<void>((resolve) => {
          conn.query(
            'SELECT * FROM nonexistent_table_xyz',
            (err: Error | null) => {
              assert(err, 'should receive an error');
              resolve();
            }
          );
        });
        conn.end();

        assertEvent(events, 'error');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:query')
          .unsubscribe(subscribers);
      }
    });

    it('should trace query in event-emitter mode', async () => {
      const events: TraceEvent<QueryTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel.tracingChannel('mysql2:query').subscribe(subscribers);
      try {
        const conn = createConnection();
        await new Promise<void>((resolve, reject) => {
          const query = conn.query('SELECT 1 AS val');
          query.on('error', reject);
          query.on('end', () => resolve());
        });
        conn.end();

        const start = assertEvent(events, 'start');
        assert(start.ctx.query.includes('SELECT 1'), 'should have query text');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:query')
          .unsubscribe(subscribers);
      }
    });
  });

  describe('mysql2:execute', () => {
    it('should trace a successful prepared statement execution', async () => {
      const events: TraceEvent<ExecuteTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel
        .tracingChannel('mysql2:execute')
        .subscribe(subscribers);
      try {
        const conn = createConnection();
        await new Promise<void>((resolve, reject) => {
          conn.execute(
            'SELECT ? + ? AS result',
            [1, 2],
            (err: Error | null, results: RowDataPacket[]) => {
              if (err) return reject(err);
              assert.strictEqual(results[0].result, 3);
              resolve();
            }
          );
        });
        conn.end();

        const start = assertEvent(events, 'start');
        assert.strictEqual(start.ctx.query, 'SELECT ? + ? AS result');
        assert.deepStrictEqual(start.ctx.values, [1, 2]);
        assert.strictEqual(start.ctx.database, config.database);

        assertEvent(events, 'asyncEnd');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:execute')
          .unsubscribe(subscribers);
      }
    });

    it('should trace a failed prepared statement', async () => {
      const events: TraceEvent<ExecuteTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel
        .tracingChannel('mysql2:execute')
        .subscribe(subscribers);
      try {
        const conn = createConnection();
        await new Promise<void>((resolve) => {
          conn.execute(
            'SELECT * FROM nonexistent_table_xyz',
            (err: Error | null) => {
              assert(err, 'should receive an error');
              resolve();
            }
          );
        });
        conn.end();

        assertEvent(events, 'error');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:execute')
          .unsubscribe(subscribers);
      }
    });
  });

  describe('mysql2:connect', () => {
    it('should trace a successful connection', async () => {
      const events: TraceEvent<ConnectTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel
        .tracingChannel('mysql2:connect')
        .subscribe(subscribers);
      try {
        const conn = createConnection();
        await new Promise<void>((resolve, reject) => {
          conn.connect((err: Error | null) => {
            if (err) return reject(err);
            resolve();
          });
        });
        conn.end();

        const start = assertEvent(events, 'start');
        assert.strictEqual(start.ctx.database, config.database);
        assert.strictEqual(start.ctx.serverAddress, config.host || 'localhost');
        assert.strictEqual(start.ctx.serverPort, config.port || 3306);
        assert(typeof start.ctx.user === 'string', 'should have user field');

        assertEvent(events, 'asyncEnd');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:connect')
          .unsubscribe(subscribers);
      }
    });

    it('should trace a failed connection', async () => {
      const events: TraceEvent<ConnectTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel
        .tracingChannel('mysql2:connect')
        .subscribe(subscribers);
      try {
        const conn = createConnection({ port: 1, connectTimeout: 1000 });
        await new Promise<void>((resolve) => {
          conn.on('error', () => {
            resolve();
          });
        });

        assertEvent(events, 'error');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:connect')
          .unsubscribe(subscribers);
      }
    });
  });

  describe('mysql2:pool:connect', () => {
    it('should trace pool getConnection', async () => {
      const events: TraceEvent<PoolConnectTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel
        .tracingChannel('mysql2:pool:connect')
        .subscribe(subscribers);
      try {
        const pool = createPool({ connectionLimit: 1 });
        await new Promise<void>((resolve, reject) => {
          pool.getConnection((err, conn) => {
            if (err) return reject(err);
            conn.release();
            resolve();
          });
        });
        await new Promise<void>((resolve) => pool.end(() => resolve()));

        const start = assertEvent(events, 'start');
        assert.strictEqual(start.ctx.database, config.database);
        assert.strictEqual(start.ctx.serverAddress, config.host || 'localhost');

        assertEvent(events, 'asyncEnd');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:pool:connect')
          .unsubscribe(subscribers);
      }
    });

    it('should trace pool.query() implicitly', async () => {
      const events: TraceEvent<PoolConnectTraceContext>[] = [];
      const subscribers = collectEvents(events);

      diagnostics_channel
        .tracingChannel('mysql2:pool:connect')
        .subscribe(subscribers);
      try {
        const pool = createPool({ connectionLimit: 1 });
        await new Promise<void>((resolve, reject) => {
          pool.query('SELECT 1', (err: Error | null) => {
            if (err) return reject(err);
            resolve();
          });
        });
        await new Promise<void>((resolve) => pool.end(() => resolve()));

        assertEvent(events, 'start');
      } finally {
        diagnostics_channel
          .tracingChannel('mysql2:pool:connect')
          .unsubscribe(subscribers);
      }
    });
  });

  describe('no subscribers', () => {
    it('should work normally without any tracing subscribers', async () => {
      const conn = createConnection();
      await new Promise<void>((resolve, reject) => {
        conn.query(
          'SELECT 1 + 1 AS result',
          (err: Error | null, results: RowDataPacket[]) => {
            if (err) return reject(err);
            assert.strictEqual(results[0].result, 2);
            resolve();
          }
        );
      });
      conn.end();
    });
  });
});
