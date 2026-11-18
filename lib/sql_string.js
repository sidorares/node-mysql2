'use strict';

const SqlString = require('sql-escaper');

const hasOwnProperty = Object.prototype.hasOwnProperty;

const BOTH_BACKSLASH_MODES = Object.freeze({
  ansiQuotes: false,
  noBackslashEscapes: true,
});
const BOTH_BACKSLASH_MODES_WITH_ANSI_QUOTES = Object.freeze({
  ansiQuotes: true,
  noBackslashEscapes: true,
});

const isEmptyArray = (values) => Array.isArray(values) && values.length === 0;

const statesNoBackslashEscapes = (sqlMode) =>
  hasOwnProperty.call(sqlMode, 'noBackslashEscapes') &&
  sqlMode.noBackslashEscapes !== undefined;

const defaultToBothBackslashModes = (sqlMode) => {
  if (typeof sqlMode !== 'object' || sqlMode === null) {
    return BOTH_BACKSLASH_MODES;
  }

  if (statesNoBackslashEscapes(sqlMode)) {
    return sqlMode;
  }

  return sqlMode.ansiQuotes === true
    ? BOTH_BACKSLASH_MODES_WITH_ANSI_QUOTES
    : BOTH_BACKSLASH_MODES;
};

const escape = (value, stringifyObjects, timezone, sqlMode) =>
  SqlString.escape(
    value,
    stringifyObjects,
    timezone,
    defaultToBothBackslashModes(sqlMode)
  );

const format = (sql, values, stringifyObjects, timezone, sqlMode) =>
  SqlString.format(
    sql,
    isEmptyArray(values) ? undefined : values,
    stringifyObjects,
    timezone,
    defaultToBothBackslashModes(sqlMode)
  );

const expand = (value, columns) => {
  if (columns === undefined) {
    throw new TypeError(
      'expand() requires the columns it may expand as its second argument, an array of strings'
    );
  }

  return SqlString.expand(value, columns);
};

module.exports = {
  escape,
  format,
  expand,
  escapeId: SqlString.escapeId,
  raw: SqlString.raw,
};
