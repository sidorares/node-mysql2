import EventEmitter from 'node:events';
import { Readable } from 'node:stream';
import { describe, it, strict } from 'poku';
import BaseConnection from '../../../lib/base/connection.js';
import Query from '../../../lib/commands/query.js';
import ConnectionConfig from '../../../lib/connection_config.js';

const factoriesWithoutStream = [
  ['returns nothing', () => undefined],
  ['is async', async () => Readable.from([])],
] as const;

const createConnection = () => {
  const config = new ConnectionConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectTimeout: 0,
  });

  config.stream = new EventEmitter();
  config.isServer = true;

  return new BaseConnection({ config });
};

const socketListeners = (connection: BaseConnection) => ({
  close: connection.stream.listenerCount('close'),
  pause: connection.stream.listenerCount('pause'),
  drain: connection.stream.listenerCount('drain'),
});

describe('LOCAL INFILE stream factory without a stream', () => {
  for (const [behavior, infileStreamFactory] of factoriesWithoutStream) {
    it(`leaves nothing on the socket when the factory ${behavior}`, () => {
      const connection = createConnection();
      const listenersBeforeLoad = socketListeners(connection);
      const query = new Query({ sql: '', infileStreamFactory }, () => {});

      strict.throws(
        () => query._streamLocalInfile(connection, 'rows.csv'),
        TypeError
      );
      strict.deepEqual(socketListeners(connection), listenersBeforeLoad);
    });
  }
});
