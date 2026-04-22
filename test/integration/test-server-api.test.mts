import { describe, it, strict } from 'poku';
import mysql from '../../index.js';

type Connection = ReturnType<typeof mysql.createConnection>;

function createTestServer(opts: any): Promise<{ server: any; port: number }> {
  return new Promise((resolve) => {
    const server = mysql.createServer(opts);
    // @ts-expect-error: internal access
    server.listen(0, () => {
      // @ts-expect-error: internal access
      const port = server._server.address().port;
      resolve({ server, port });
    });
  });
}

function connectAndQuery(
  port: number,
  sql: string,
  opts: Record<string, any> = {}
): Promise<{ rows?: any; error?: any }> {
  return new Promise((resolve) => {
    const conn: Connection = mysql.createConnection({
      host: '127.0.0.1',
      port,
      user: opts.user || 'test',
      database: 'test',
    });
    conn.on('error', (err: any) => {
      resolve({ error: err });
    });
    conn.query(sql, (err: any, rows: any) => {
      conn.end(() => {});
      if (err) return resolve({ error: err });
      resolve({ rows });
    });
  });
}

await describe('Server API - static handlers', async () => {
  await it('should handle query returning array of rows', async () => {
    const { server, port } = await createTestServer({
      query() {
        return [{ id: 1, name: 'hello' }];
      },
    });
    const { rows } = await connectAndQuery(port, 'SELECT 1');
    server.close(() => {});
    strict.ok(Array.isArray(rows));
    strict.equal(rows.length, 1);
    strict.equal(rows[0].id, '1');
    strict.equal(rows[0].name, 'hello');
  });

  await it('should handle query returning { rows, columns }', async () => {
    const { server, port } = await createTestServer({
      query() {
        return {
          rows: [{ val: 42 }],
          columns: [{ name: 'val' }],
        };
      },
    });
    const { rows } = await connectAndQuery(port, 'SELECT val');
    server.close(() => {});
    strict.equal(rows[0].val, '42');
  });

  await it('should handle query returning affectedRows', async () => {
    const { server, port } = await createTestServer({
      query() {
        return { affectedRows: 3, insertId: 10 };
      },
    });
    const { rows: result } = await connectAndQuery(port, 'INSERT INTO t');
    server.close(() => {});
    strict.equal(result.affectedRows, 3);
    strict.equal(result.insertId, 10);
  });

  await it('should handle query throwing error', async () => {
    const { server, port } = await createTestServer({
      query() {
        throw new Error('Something went wrong');
      },
    });
    const { error } = await connectAndQuery(port, 'SELECT 1');
    server.close(() => {});
    strict.ok(error);
    strict.ok(error.message.includes('Something went wrong'));
  });

  await it('should handle ping', async () => {
    let pingCalled = false;
    const { server, port } = await createTestServer({
      query() {
        return [];
      },
      ping() {
        pingCalled = true;
      },
    });
    await new Promise<void>((resolve) => {
      const conn: Connection = mysql.createConnection({
        host: '127.0.0.1',
        port,
        user: 'test',
        database: 'test',
      });
      conn.ping(() => {
        conn.end(() => server.close(() => resolve()));
      });
    });
    strict.ok(pingCalled, 'ping handler should have been called');
  });
});

await describe('Server API - factory function', async () => {
  await it('should support per-connection state via factory', async () => {
    let connectionCount = 0;
    const { server, port } = await createTestServer((_conn: any) => {
      const myId = ++connectionCount;
      return {
        query(sql: string) {
          return [{ connId: myId, sql }];
        },
      };
    });
    const { rows } = await connectAndQuery(port, 'hello world');
    server.close(() => {});
    strict.equal(rows[0].connId, '1');
    strict.equal(rows[0].sql, 'hello world');
  });
});

await describe('Server API - auth handler', async () => {
  await it('should reject connection when auth throws', async () => {
    const { server, port } = await createTestServer({
      auth({ user }: { user: string }) {
        if (user !== 'admin') throw new Error('Access denied');
      },
      query() {
        return [];
      },
    });
    const { error } = await connectAndQuery(port, 'SELECT 1');
    server.close(() => {});
    strict.ok(error);
    strict.ok(error.message.includes('Access denied'));
  });

  await it('should accept connection when auth resolves', async () => {
    const { server, port } = await createTestServer({
      auth({ user }: { user: string }) {
        if (user !== 'admin') throw new Error('Access denied');
      },
      query() {
        return [{ ok: 1 }];
      },
    });
    const { rows } = await connectAndQuery(port, 'SELECT 1', {
      user: 'admin',
    });
    server.close(() => {});
    strict.equal(rows[0].ok, '1');
  });
});

await describe('Server API - backward compatibility', async () => {
  await it('legacy createServer(handler) + serverHandshake', async () => {
    const { server, port } = await createTestServer((conn: any) => {
      conn.serverHandshake({
        protocolVersion: 10,
        serverVersion: 'legacy-server',
        connectionId: 1,
        statusFlags: 2,
        characterSet: 8,
        capabilityFlags: 0xffffff,
      });
      conn.on('query', () => {
        conn.writeColumns([
          {
            catalog: 'def',
            schema: '',
            table: '',
            orgTable: '',
            name: 'legacy',
            orgName: 'legacy',
            characterSet: 33,
            columnLength: 255,
            columnType: 253,
            flags: 0,
            decimals: 0,
          },
        ]);
        conn.writeTextRow(['yes']);
        conn.writeEof();
      });
    });
    const { rows } = await connectAndQuery(port, 'SELECT 1');
    server.close(() => {});
    strict.equal(rows[0].legacy, 'yes');
  });
});
