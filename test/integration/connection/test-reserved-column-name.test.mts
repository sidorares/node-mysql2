import type { Connection } from '../../../index.js';
import { createRequire } from 'node:module';
import { describe, it, strict } from 'poku';
import { createConnection, createServer } from '../../common.test.mjs';

const require = createRequire(import.meta.url);
const ServerStatus = require('../../../lib/constants/server_status.js');

type ColumnDef = {
  catalog: string;
  schema: string;
  table: string;
  orgTable: string;
  name: string;
  orgName: string;
  characterSet: number;
  columnLength: number;
  columnType: number;
  flags: number;
  decimals: number;
};

const column = (name: string): ColumnDef => ({
  catalog: 'def',
  schema: '',
  table: '',
  orgTable: '',
  name,
  orgName: '',
  characterSet: 63,
  columnLength: 1,
  columnType: 8,
  flags: 129,
  decimals: 0,
});

const RESERVED_QUERY = 'SELECT 1 AS `__proto__`';
const OK_QUERY = 'SELECT 2 AS ok';
const RESERVED_ERROR = /private property/;

const withServer = (
  handler: (conn: Connection) => void,
  run: (port: number, done: () => void) => void
): Promise<void> =>
  new Promise<void>((resolve) => {
    const server = createServer(
      () => {
        // @ts-expect-error: internal access
        run(server._port, () => {
          // @ts-expect-error: internal access
          server._server.close();
          resolve();
        });
      },
      (conn) => handler(conn)
    );
  });

await describe('Reserved column name (e.g. `__proto__`)', async () => {
  await it('rejects the query but keeps the connection usable (compiled parser)', async () => {
    await withServer(
      (conn) => {
        conn.on('query', (q: string) => {
          if (q === RESERVED_QUERY) {
            conn.writeTextResult([{ 1: '1' }], [column('__proto__')]);
          } else {
            conn.writeTextResult([{ ok: '2' }], [column('ok')]);
          }
        });
      },
      (port, done) => {
        const connection = createConnection({ port });
        connection.query(RESERVED_QUERY, (err1) => {
          strict.match(String(err1 && err1.message), RESERVED_ERROR);
          connection.query(OK_QUERY, (err2, rows) => {
            strict.ifError(err2 ?? undefined);
            strict.deepEqual(rows, [{ ok: 2 }]);
            connection.end(() => done());
          });
        });
      }
    );
  });

  await it('rejects the query but keeps the connection usable (static parser, disableEval)', async () => {
    await withServer(
      (conn) => {
        conn.on('query', (q: string) => {
          if (q === RESERVED_QUERY) {
            conn.writeTextResult(
              [{ 1: '1' }, { 1: '2' }, { 1: '3' }],
              [column('__proto__')]
            );
          } else {
            conn.writeTextResult([{ ok: '2' }], [column('ok')]);
          }
        });
      },
      (port, done) => {
        const connection = createConnection({ port, disableEval: true });
        connection.on('error', () => {
          strict.fail('connection must not emit a fatal error');
        });
        connection.query(RESERVED_QUERY, (err1) => {
          strict.match(String(err1 && err1.message), RESERVED_ERROR);
          connection.query(OK_QUERY, (err2, rows) => {
            strict.ifError(err2 ?? undefined);
            strict.deepEqual(rows, [{ ok: 2 }]);
            connection.end(() => done());
          });
        });
      }
    );
  });

  await it('drains the remaining result sets of a multi-statement reply before reporting', async () => {
    await withServer(
      (conn) => {
        conn.on('query', (q: string) => {
          if (q.includes('__proto__')) {
            // first result set: reserved column, EOF with MORE_RESULTS
            // @ts-expect-error: server-side helper missing from the typings
            conn.writeColumns([column('__proto__')]);
            // @ts-expect-error: server-side helper missing from the typings
            conn.writeTextRow(['1']);
            conn.writeEof(0, ServerStatus.SERVER_MORE_RESULTS_EXISTS);
            // second result set: valid, must be consumed before the error
            conn.writeTextResult([{ ok: '2' }], [column('ok')]);
          } else {
            conn.writeTextResult([{ ok: '2' }], [column('ok')]);
          }
        });
      },
      (port, done) => {
        const connection = createConnection({
          port,
          multipleStatements: true,
        });
        connection.on('error', () => {
          strict.fail('connection must not emit a fatal error');
        });
        connection.query(
          `${RESERVED_QUERY}; ${OK_QUERY}`,
          (err1: Error | null) => {
            strict.match(String(err1 && err1.message), RESERVED_ERROR);
            connection.query(OK_QUERY, (err2, rows) => {
              strict.ifError(err2 ?? undefined);
              strict.deepEqual(rows, [{ ok: 2 }]);
              connection.end(() => done());
            });
          }
        );
      }
    );
  });

  await it('rejects a prepared statement but keeps the connection usable (binary protocol)', async () => {
    await withServer(
      (conn) => {
        conn.on('stmt_prepare', () => {
          // prepared statement OK: id 1, 1 column, 0 params
          const payload = Buffer.alloc(12 + 4);
          payload.writeUInt8(0, 4); // status OK
          payload.writeUInt32LE(1, 5); // statement id
          payload.writeUInt16LE(1, 9); // num columns
          payload.writeUInt16LE(0, 11); // num params
          payload.writeUInt8(0, 13); // reserved
          payload.writeUInt16LE(0, 14); // warnings
          const Packets =
            // @ts-expect-error: internal access with a runtime fallback
            conn.constructor.Packets ??
            require('../../../lib/packets/index.js');
          const packet = new Packets.Packet(0, payload, 0, payload.length);
          conn.writePacket(packet);
          conn.writePacket(
            Packets.ColumnDefinition.toPacket(
              column('__proto__'),
              // @ts-expect-error: internal access (same call shape as
              // lib's own server-side writeColumns helper)
              conn.serverConfig.encoding
            )
          );
          conn.writeEof();
        });
        conn.on('stmt_execute', () => {
          // @ts-expect-error: `binary` flag is missing from the typings
          conn.writeTextResult([{ 1: '1' }], [column('__proto__')], true);
        });
        conn.on('query', (q: string) => {
          strict.equal(q, OK_QUERY);
          conn.writeTextResult([{ ok: '2' }], [column('ok')]);
        });
      },
      (port, done) => {
        const connection = createConnection({ port });
        connection.on('error', () => {
          strict.fail('connection must not emit a fatal error');
        });
        connection.execute(RESERVED_QUERY, [], (err1: Error | null) => {
          strict.match(String(err1 && err1.message), RESERVED_ERROR);
          connection.query(OK_QUERY, (err2, rows) => {
            strict.ifError(err2 ?? undefined);
            strict.deepEqual(rows, [{ ok: 2 }]);
            connection.end(() => done());
          });
        });
      }
    );
  });
});
