import { describe, it, strict } from 'poku';
import {
  _clear,
  _daysFromCivil,
  checkTimezone,
  localDate,
} from '../../../lib/parsers/local_date.js';

type Parts = [number, number, number, number, number, number, number];

const reference = (parts: Parts): number =>
  new Date(
    parts[0],
    parts[1] - 1,
    parts[2],
    parts[3],
    parts[4],
    parts[5],
    parts[6]
  ).getTime();

const sameInstant = (a: number, b: number): boolean =>
  a === b || (Number.isNaN(a) && Number.isNaN(b));

// wall-clock milliseconds (the value as if it were UTC) to constructor parts
const partsOf = (wallTime: number): Parts => {
  const wall = new Date(wallTime);
  return [
    wall.getUTCFullYear(),
    wall.getUTCMonth() + 1,
    wall.getUTCDate(),
    wall.getUTCHours(),
    wall.getUTCMinutes(),
    wall.getUTCSeconds(),
    wall.getUTCMilliseconds(),
  ];
};

// the checks run millions of times, so they collect mismatches and the
// tests assert once on the collection
const mismatch = (parts: Parts, label: string): string | null => {
  const expected = reference(parts);
  const actual = localDate(...parts).getTime();
  if (sameInstant(expected, actual)) {
    return null;
  }
  return `${label}: ${parts.join('-')} expected ${expected}, got ${actual}`;
};

// every hour where the constructor's offset differs from the previous hour
const transitionsBetween = (fromYear: number, toYear: number): number[] => {
  const transitions: number[] = [];
  let previous: number | null = null;
  for (
    let wall = Date.UTC(fromYear, 0, 1);
    wall < Date.UTC(toYear, 0, 1);
    wall += 3600000
  ) {
    const offset = wall - reference(partsOf(wall));
    if (previous !== null && offset !== previous) {
      transitions.push(wall);
    }
    previous = offset;
  }
  return transitions;
};

const checkZone = (label: string): string[] => {
  _clear();
  const mismatches: string[] = [];
  const check = (wallTime: number, what: string): void => {
    const found = mismatch(partsOf(wallTime), `${label} ${what}`);
    if (found !== null && mismatches.length < 10) {
      mismatches.push(found);
    }
  };
  for (
    let wall = Date.UTC(2019, 0, 1);
    wall < Date.UTC(2027, 0, 1);
    wall += 3600000
  ) {
    check(wall, 'hourly');
    check(wall + 1234567, 'hourly');
  }
  for (const transition of transitionsBetween(2019, 2027)) {
    for (
      let wall = transition - 2 * 3600000;
      wall <= transition + 2 * 3600000;
      wall += 60000
    ) {
      check(wall, 'minutes around a transition');
    }
    for (
      let wall = transition - 3600000 - 2000;
      wall <= transition - 3600000 + 2000;
      wall += 1
    ) {
      check(wall, 'milliseconds around a transition');
    }
    for (let wall = transition - 2000; wall <= transition + 2000; wall += 1) {
      check(wall, 'milliseconds around a transition');
    }
  }
  return mismatches;
};

describe('localDate', () => {
  it('computes the same day number as Date.UTC for every month and day, including overflow', () => {
    const mismatches: string[] = [];
    const check = (year: number, month: number, day: number): void => {
      const expected = Date.UTC(year, month - 1, day) / 86400000;
      const actual = _daysFromCivil(year, month, day);
      if (expected !== actual && mismatches.length < 10) {
        mismatches.push(`${year}-${month}-${day}: ${actual} vs ${expected}`);
      }
    };
    for (let year = 100; year <= 2400; year++) {
      for (let month = 1; month <= 12; month++) {
        for (let day = -1; day <= 32; day++) {
          check(year, month, day);
        }
      }
    }
    for (const year of [2800, 4000, 6000, 9999]) {
      for (let month = 1; month <= 12; month++) {
        check(year, month, 29);
      }
    }
    strict.deepEqual(mismatches, []);
  });

  it('matches the Date constructor in the current time zone, across DST transitions', () => {
    strict.deepEqual(checkZone('current zone'), []);
  });

  it('matches the Date constructor for out-of-range and fallback arguments', () => {
    _clear();
    const cases: Parts[] = [
      [2024, 1, 0, 0, 0, 0, 0],
      [2024, 2, 30, 25, 61, 61, 0],
      [2024, 2, 29, 23, 59, 59, 999.9],
      [2023, 3, 12, 2, 30, 0, 0.4],
      [99, 5, 5, 5, 5, 5, 5],
      [0, 1, 1, 0, 0, 0, 0],
      [2024, 0, 15, 0, 0, 0, 0],
      [2024, 13, 1, 0, 0, 0, 0],
      [9999, 12, 31, 23, 59, 59, 999],
      [100, 1, 1, 0, 0, 0, 0],
      [1969, 12, 31, 23, 59, 59, 999],
      [1970, 1, 1, 0, 0, 0, 0],
      [2024, 11, 3, 1, 30, 0, 0],
      [2024, 3, 10, 2, 30, 0, 0],
    ];
    const mismatches = cases
      .map((parts) => mismatch(parts, 'edge case'))
      .filter((found) => found !== null);
    strict.deepEqual(mismatches, []);
  });

  it('follows process.env.TZ changes and holds across DST in other zones', () => {
    const original = process.env.TZ;
    const honorsTimezoneChanges = (() => {
      process.env.TZ = 'Asia/Kathmandu';
      const kathmandu = new Date(2024, 0, 1).getTimezoneOffset();
      process.env.TZ = 'America/St_Johns';
      const stJohns = new Date(2024, 0, 1).getTimezoneOffset();
      return kathmandu === -345 && stJohns === 210;
    })();
    try {
      if (!honorsTimezoneChanges) {
        return;
      }
      for (const zone of [
        'America/New_York',
        'Europe/Dublin',
        'Australia/Lord_Howe',
        'Pacific/Chatham',
        'Africa/Casablanca',
        'America/Santiago',
      ]) {
        process.env.TZ = zone;
        checkTimezone();
        strict.deepEqual(checkZone(zone), []);
      }
      process.env.TZ = 'America/New_York';
      checkTimezone();
      const newYork = localDate(2024, 6, 15, 12, 0, 0, 0).getTime();
      process.env.TZ = 'Asia/Tokyo';
      checkTimezone();
      const tokyo = localDate(2024, 6, 15, 12, 0, 0, 0).getTime();
      strict.notEqual(newYork, tokyo);
      strict.equal(tokyo, new Date(2024, 5, 15, 12, 0, 0, 0).getTime());
    } finally {
      if (original === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = original;
      }
      checkTimezone();
    }
  });
});
