'use strict';

const Types = require('../constants/types.js');
const helpers = require('../helpers.js');

// new Date(y, m, d, h, mi, s, ms) interprets its arguments as local wall
// time; the wall-time to UTC conversion inside that constructor dominates
// the cost of materializing a DATE, DATETIME or TIMESTAMP value. The
// conversion depends only on the wall-clock instant, and the offset it
// applies is constant across almost every hour (it changes only at DST
// transitions), so the offset is cached per wall-clock hour once the real
// constructor has confirmed it holds over the whole hour. Hours where it
// does not hold keep using the constructor.

const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;
const MAX_CACHED_HOURS = 4096;

const hourOffsets = new Map();
let lastTimezone = readTimezone();

function readTimezone() {
  try {
    return process.env.TZ;
  } catch {
    return undefined;
  }
}

// Node resets its own time zone cache when process.env.TZ is assigned;
// called once per result set so the offsets cached here follow suit
function checkTimezone() {
  const timezone = readTimezone();
  if (timezone !== lastTimezone) {
    lastTimezone = timezone;
    hourOffsets.clear();
  }
}

// days since 1970-01-01 in the proleptic Gregorian calendar, the same value
// ECMAScript's MakeDay produces for a month in 1..12 and any integer day
function daysFromCivil(year, month, day) {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = (((153 * ((month + 9) % 12) + 2) / 5) | 0) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    ((yearOfEra / 4) | 0) -
    ((yearOfEra / 100) | 0) +
    dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

function localTime(wallTime) {
  const wall = new Date(wallTime);
  return new Date(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate(),
    wall.getUTCHours(),
    wall.getUTCMinutes(),
    wall.getUTCSeconds(),
    wall.getUTCMilliseconds()
  ).getTime();
}

// the offset is trusted for the hour only when the constructor applies the
// same one at its start, middle and end; null marks an hour that contains a
// transition
function proveHourOffset(hour) {
  const start = hour * MS_PER_HOUR;
  const offset = start - localTime(start);
  if (
    offset !== start + MS_PER_HOUR / 2 - localTime(start + MS_PER_HOUR / 2) ||
    offset !== start + MS_PER_HOUR - 1 - localTime(start + MS_PER_HOUR - 1) ||
    Number.isNaN(offset)
  ) {
    return null;
  }
  return offset;
}

// same value as new Date(year, month - 1, day, hours, minutes, seconds,
// milliseconds), for the integer arguments the wire protocols carry
function localDate(year, month, day, hours, minutes, seconds, milliseconds) {
  if (year < 100 || month < 1 || month > 12) {
    return new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      seconds,
      milliseconds
    );
  }
  const wallTime =
    daysFromCivil(year, month, day) * MS_PER_DAY +
    hours * MS_PER_HOUR +
    minutes * 60000 +
    seconds * 1000 +
    Math.trunc(milliseconds);
  const hour = Math.floor(wallTime / MS_PER_HOUR);
  let offset = hourOffsets.get(hour);
  if (offset === undefined) {
    if (hourOffsets.size >= MAX_CACHED_HOURS) {
      hourOffsets.clear();
    }
    offset = proveHourOffset(hour);
    hourOffsets.set(hour, offset);
  }
  if (offset === null) {
    return new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      seconds,
      milliseconds
    );
  }
  return new Date(wallTime - offset);
}

// whether a column's values are built through localDate, so the parser
// for a result set knows to call checkTimezone first
function usesLocalDate(field, options, config) {
  const timezone = options.timezone || config.timezone;
  if (timezone && timezone !== 'local') {
    return false;
  }
  const type = field.columnType;
  if (
    type !== Types.DATE &&
    type !== Types.DATETIME &&
    type !== Types.TIMESTAMP &&
    type !== Types.NEWDATE
  ) {
    return false;
  }
  return !helpers.typeMatch(
    type,
    options.dateStrings || config.dateStrings,
    Types
  );
}

module.exports = {
  localDate,
  checkTimezone,
  usesLocalDate,
  _daysFromCivil: daysFromCivil,
  _clear() {
    hourOffsets.clear();
  },
};
