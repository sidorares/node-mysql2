'use strict';

const columnDefaults = {
  catalog: 'def',
  schema: '',
  table: '',
  orgTable: '',
  orgName: '',
  characterSet: 33,
  columnLength: 255,
  columnType: 253,
  flags: 0,
  decimals: 0,
};

function normalizeColumn(col) {
  if (typeof col === 'string') {
    return Object.assign({}, columnDefaults, { name: col, orgName: col });
  }
  return Object.assign({}, columnDefaults, { orgName: col.name }, col);
}

function inferColumns(row) {
  return Object.keys(row).map((name) =>
    Object.assign({}, columnDefaults, { name, orgName: name })
  );
}

function sendResult(connection, result) {
  if (result === undefined || result === null) {
    connection.writeOk();
    connection.sequenceId = 0;
    return;
  }

  if (Array.isArray(result)) {
    const columns = result.length > 0 ? inferColumns(result[0]) : [];
    connection.writeTextResult(result, columns);
    connection.sequenceId = 0;
    return;
  }

  if (typeof result === 'object') {
    if (result.rows !== undefined && result.columns !== undefined) {
      connection.writeTextResult(
        result.rows,
        result.columns.map(normalizeColumn)
      );
      connection.sequenceId = 0;
      return;
    }
    if (result.affectedRows !== undefined) {
      connection.writeOk(result);
      connection.sequenceId = 0;
      return;
    }
  }

  connection.writeOk();
  connection.sequenceId = 0;
}

function sendError(connection, err) {
  connection.writeError({
    message: err.message || String(err),
    code: err.code || err.errno || 1149,
  });
  connection.sequenceId = 0;
}

module.exports = { sendResult, sendError };
