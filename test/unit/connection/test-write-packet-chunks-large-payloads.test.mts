import { Buffer } from 'node:buffer';
import EventEmitter from 'node:events';
import { describe, it, strict } from 'poku';
import BaseConnection from '../../../lib/base/connection.js';
import ConnectionConfig from '../../../lib/connection_config.js';
import Packet from '../../../lib/packets/packet.js';

const MAX_CHUNK = 0xffffff;

function createCapturingConnection(written: Buffer[]) {
  const config = new ConnectionConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectTimeout: 0,
  });

  const mockStream = Object.assign(new EventEmitter(), {
    write: (buffer: Buffer, callback?: (err?: Error) => void) => {
      written.push(Buffer.from(buffer));
      callback?.();
      return true;
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

  return new BaseConnection({ config });
}

const packetOf = (payload: Buffer): typeof Packet.prototype => {
  const buffer = Buffer.concat([Buffer.alloc(4), payload]);
  return new Packet(0, buffer, 0, buffer.length);
};

describe('writePacket splits payloads above the 16MB protocol limit', () => {
  it('writes a small packet whole, with its own header', () => {
    const written: Buffer[] = [];
    const connection = createCapturingConnection(written);
    const payload = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

    connection.writePacket(packetOf(payload));

    strict.equal(written.length, 1);
    strict.deepEqual([...written[0].subarray(0, 4)], [8, 0, 0, 0]);
    strict.equal(Buffer.compare(written[0].subarray(4), payload), 0);
    strict.equal(connection.sequenceId, 1);
  });

  it('chunks a payload above the limit and reassembles losslessly', () => {
    const written: Buffer[] = [];
    const connection = createCapturingConnection(written);
    const payload = Buffer.allocUnsafe(MAX_CHUNK + 100).fill(0xab);
    payload[0] = 0x01;
    payload[MAX_CHUNK - 1] = 0x02;
    payload[MAX_CHUNK] = 0x03;
    payload[payload.length - 1] = 0x04;

    connection.writePacket(packetOf(payload));

    strict.equal(written.length, 4);
    strict.deepEqual([...written[0]], [0xff, 0xff, 0xff, 0]);
    strict.equal(written[1].length, MAX_CHUNK);
    strict.deepEqual([...written[2]], [100, 0, 0, 1]);
    strict.equal(written[3].length, 100);
    strict.equal(
      Buffer.compare(Buffer.concat([written[1], written[3]]), payload),
      0
    );
    strict.equal(connection.sequenceId, 2);
  });
});
