import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Execute from '../../../lib/packets/execute.js';
import Packet from '../../../lib/packets/packet.js';

const reparse = (execute: InstanceType<typeof Execute>) => {
  const buf = execute.toPacket().buffer;
  const packet = new Packet(0, buf, 0, buf.length);
  packet.readInt8(); // the COM_STMT_EXECUTE byte, consumed by the dispatcher
  return Execute.fromPacket(packet, 'utf8');
};

describe('Execute packet: parameter encoding round-trip', () => {
  it('should send and decode Buffer parameters as BLOB', () => {
    const blob = Buffer.from([0x80, 0x00, 0xff, 0x42]);
    const execute = new Execute(1, ['text', blob, null], 224, 'local');
    const parsed = reparse(execute);
    strict.equal(parsed.stmtId, 1);
    strict.equal(parsed.values[0], 'text');
    strict.ok(Buffer.isBuffer(parsed.values[1]));
    strict.deepEqual(parsed.values[1], blob);
    strict.equal(parsed.values[2], null);
  });

  it('should send JSON objects as strings when jsonAsString is set', () => {
    const value = { a: [1, 'x'] };
    // MariaDB rejects the JSON parameter type; jsonAsString keeps the
    // parameter a VAR_STRING
    const asString = new Execute(2, [value], 224, 'local', undefined, 0, true);
    const parsed = reparse(asString);
    strict.equal(parsed.values[0], JSON.stringify(value));

    // without jsonAsString the parameter keeps the JSON type
    const asJson = new Execute(2, [value], 224, 'local');
    strict.deepEqual(reparse(asJson).values[0], value);
  });
});
