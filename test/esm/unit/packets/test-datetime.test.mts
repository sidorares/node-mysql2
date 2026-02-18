import { Buffer } from 'node:buffer';
import { assert, describe, it } from 'poku';
import Packets from '../../../../lib/packets/index.js';

describe('DateTime packet parsing', () => {
  it('should parse a simple datetime packet', () => {
    const buf = Buffer.from('0a000004000007dd070116010203', 'hex');

    const packet = new Packets.Packet(4, buf, 0, buf.length);
    packet.readInt16(); // unused
    const d = packet.readDateTime('Z');
    if (d === null) throw new Error('expected d to be non-null');
    assert.equal(+d, 1358816523000);
  });

  it('should parse a datetime packet with mixed string fields', () => {
    const buf = Buffer.from(
      '18000006000004666f6f310be00702090f01095d7f06000462617231',
      'hex'
    );
    const packet = new Packets.Packet(6, buf, 0, buf.length);

    packet.readInt16(); // ignore
    const s = packet.readLengthCodedString('cesu8');
    assert.equal(s, 'foo1');
    const d = packet.readDateTime('Z');
    if (d === null) throw new Error('expected d to be non-null');
    assert.equal(+d, 1455030069425);

    const s1 = packet.readLengthCodedString('cesu8');
    assert.equal(s1, 'bar1');
    assert.equal(packet.offset, packet.end);
  });
});
