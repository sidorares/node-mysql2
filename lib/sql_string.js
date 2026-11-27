'use strict';

const SqlString = require('sql-escaper');

const NO_BACKSLASH_ESCAPES = Object.freeze({ noBackslashEscapes: true });

const isEmptyArray = (values) => Array.isArray(values) && values.length === 0;

const sqlModeOf = (config) =>
  config.noBackslashEscapes ? NO_BACKSLASH_ESCAPES : undefined;

const format = (sql, values, stringifyObjects, timezone, sqlMode) =>
  SqlString.format(
    sql,
    isEmptyArray(values) ? undefined : values,
    stringifyObjects,
    timezone,
    sqlMode
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
  escape: SqlString.escape,
  format,
  expand,
  escapeId: SqlString.escapeId,
  raw: SqlString.raw,
  sqlModeOf,
};
