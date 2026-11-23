import { describe, it, strict } from 'poku';
import Execute from '../../../lib/packets/execute.js';
import Packet from '../../../lib/packets/packet.js';

const reparse = (execute: InstanceType<typeof Execute>) => {
  const buffer = execute.toPacket().buffer;
  const packet = new Packet(0, buffer, 0, buffer.length);
  packet.readInt8();
  return Execute.fromPacket(packet, 'utf8');
};

const values: [string, Record<string, unknown>][] = [
  [
    'null prototype',
    Object.assign(Object.create(null), { name: 'item', count: 2 }),
  ],
  ['string constructor', { constructor: 'part', name: 'item' }],
  ['null constructor', { constructor: null, name: 'item' }],
  ['numeric constructor', { constructor: 42, name: 'item' }],
  ['object constructor', { constructor: { name: 'part' }, name: 'item' }],
  ['undefined constructor', { constructor: undefined, name: 'item' }],
  [
    'prototype-named properties',
    JSON.parse(
      '{"constructor":"part","__proto__":{"item":true},"prototype":"data"}'
    ),
  ],
  ['array-like shape', JSON.parse('{"constructor":"part","length":4}')],
  [
    'buffer-like shape',
    JSON.parse('{"constructor":"part","type":"Buffer","data":[1,2]}'),
  ],
];

for (const jsonAsString of [false, true]) {
  describe(`Execute JSON parameters (jsonAsString=${jsonAsString})`, () => {
    for (const [name, value] of values) {
      it(`round-trips an object with ${name}`, () => {
        const execute = new Execute(
          1,
          [value],
          224,
          'local',
          undefined,
          0,
          jsonAsString
        );
        const parsed = reparse(execute);
        const expected = JSON.stringify(value);
        strict.deepEqual(
          parsed.values[0],
          jsonAsString ? expected : JSON.parse(expected)
        );
        if (!jsonAsString) {
          strict.equal(
            Object.getPrototypeOf(parsed.values[0]),
            Object.prototype
          );
        }
      });
    }
  });
}
