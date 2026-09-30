import { Buffer } from 'node:buffer';
import EventEmitter from 'node:events';
import { Readable } from 'node:stream';
import { describe, it, strict } from 'poku';
import BaseConnection from '../../../lib/base/connection.js';
import Query from '../../../lib/commands/query.js';
import ConnectionConfig from '../../../lib/connection_config.js';

function createQueueingConnection(written: Buffer[], sequenceId: number) {
  const config = new ConnectionConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectTimeout: 0,
  });

  const mockStream = Object.assign(new EventEmitter(), {
    write: (buffer: Buffer) => {
      written.push(buffer);
      return false;
    },
    end: () => {},
    destroy() {
      this.destroyed = true;
    },
    destroyed: false,
    setKeepAlive: () => {},
    setNoDelay: () => {},
  });

  config.stream = mockStream;
  config.isServer = true;

  const connection = new BaseConnection({ config });
  connection.sequenceId = sequenceId;

  return connection;
}

const terminatorSequenceIds = (written: Buffer[][]) =>
  written.map((buffers) => buffers[buffers.length - 1][3]);

await describe('LOCAL INFILE terminator packet', async () => {
  it('keeps each connection sequence id when no stream factory is set', () => {
    const written: Buffer[][] = [[], []];
    const first = createQueueingConnection(written[0], 7);
    const second = createQueueingConnection(written[1], 42);

    new Query({ sql: '' }, () => {})._streamLocalInfile(first, 'file');
    new Query({ sql: '' }, () => {})._streamLocalInfile(second, 'file');

    strict.deepEqual(terminatorSequenceIds(written), [7, 42]);
  });

  await it('keeps each connection sequence id when the local stream ends', async () => {
    const written: Buffer[][] = [[], []];
    const first = createQueueingConnection(written[0], 7);
    const second = createQueueingConnection(written[1], 42);
    const streams = [Readable.from([]), Readable.from([])];
    const ended = streams.map(
      (stream) => new Promise((resolve) => stream.once('end', resolve))
    );

    new Query(
      { sql: '', infileStreamFactory: () => streams[0] },
      () => {}
    )._streamLocalInfile(first, 'file');
    new Query(
      { sql: '', infileStreamFactory: () => streams[1] },
      () => {}
    )._streamLocalInfile(second, 'file');

    await Promise.all(ended);

    strict.deepEqual(terminatorSequenceIds(written), [7, 42]);
  });
});
