import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Packet from '../../../lib/packets/packet.js';

function packetFor(value: string) {
  const payload = Buffer.from(value, 'latin1');
  const buf = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from([payload.length]),
    payload,
  ]);
  return new Packet(0, buf, 0, buf.length);
}

/** Reference: the previous implementation, Date-from-string. */
function legacyParse(value: string, timezone?: string) {
  if (!timezone || timezone === 'local') {
    return new Date(value);
  }
  return new Date(`${value}${timezone}`);
}

function sameDate(a: Date, b: Date) {
  return (
    (Number.isNaN(a.getTime()) && Number.isNaN(b.getTime())) ||
    a.getTime() === b.getTime()
  );
}

/** parseDateTime only returns null for SQL NULL, which these helpers never encode. */
function parseNonNull(value: string, timezone?: string): Date {
  const parsed = packetFor(value).parseDateTime(timezone);
  if (parsed === null) {
    strict.fail(`unexpected null for ${value} @ ${timezone}`);
  }
  return parsed;
}

describe('Packet.parseDateTime', () => {
  const values = [
    '2020-01-01 13:45:56',
    '2020-01-01 13:45:56.123456',
    '2020-12-31 23:59:59.9',
    '1000-01-01 00:00:00',
    '9999-12-31 23:59:59',
    '2024-02-29 12:00:00',
    // zero/invalid dates -> Invalid Date, like Date-from-string
    '0000-00-00 00:00:00',
    '2020-00-15 10:00:00',
    '2020-01-00 10:00:00',
    // years below 100 take the string fallback (Date(y, ...) would remap them)
    '0099-01-01 00:00:00',
    '0001-06-15 12:30:45',
    // non-standard shapes take the string fallback
    '2020-01-01',
    '2020/01/01 10:00:00',
    'not a date at all!!',
  ];
  // '+05:30' appears twice: the second pass hits the memoized offset
  const timezones = [
    undefined,
    'local',
    'Z',
    '+05:30',
    '+05:30',
    '-08:00',
    '+00:00',
    'PST',
  ];

  it('matches Date-from-string semantics for every timezone', () => {
    for (const timezone of timezones) {
      for (const value of values) {
        const parsed = parseNonNull(value, timezone);
        const expected = legacyParse(value, timezone);
        strict.ok(
          sameDate(parsed, expected),
          `${value} @ ${timezone}: got ${parsed}, expected ${expected}`
        );
      }
    }
  });

  it('keeps millisecond precision from fractional seconds', () => {
    strict.equal(
      parseNonNull('2020-01-01 00:00:00.123456', 'Z').getTime(),
      Date.UTC(2020, 0, 1, 0, 0, 0, 123)
    );
    strict.equal(
      parseNonNull('2020-01-01 00:00:00.5', 'Z').getTime(),
      Date.UTC(2020, 0, 1, 0, 0, 0, 500)
    );
  });

  it('applies fixed timezone offsets', () => {
    strict.equal(
      parseNonNull('2020-01-01 05:30:00', '+05:30').getTime(),
      Date.UTC(2020, 0, 1, 0, 0, 0)
    );
    strict.equal(
      parseNonNull('2020-01-01 00:00:00', '-08:00').getTime(),
      Date.UTC(2020, 0, 1, 8, 0, 0)
    );
  });

  it('returns null for SQL NULL', () => {
    const buf = Buffer.concat([Buffer.alloc(4), Buffer.from([0xfb])]);
    const packet = new Packet(0, buf, 0, buf.length);
    strict.equal(packet.parseDateTime('Z'), null);
  });

  it('leaves the offset at the end of the value', () => {
    const packet = packetFor('2020-01-01 13:45:56');
    packet.parseDateTime('local');
    strict.equal(packet.haveMoreData(), false);
  });
});
