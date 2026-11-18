'use strict';

const SqlString = require('sql-escaper');

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
  format: SqlString.format,
  expand,
  escapeId: SqlString.escapeId,
  raw: SqlString.raw,
};
