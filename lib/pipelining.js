'use strict';

const ServerStatus = require('./constants/server_status.js');

const SESSION_NEUTRAL_STATEMENT =
  /^\s*(?:SELECT|INSERT|UPDATE|DELETE|REPLACE|WITH|VALUES|TABLE|SHOW|DESCRIBE|DESC|EXPLAIN)\b/i;
const NON_ASCII = /[\u0080-\uffff]/;

function isSessionNeutral(sql, multipleStatements) {
  return (
    typeof sql === 'string' &&
    SESSION_NEUTRAL_STATEMENT.test(sql) &&
    !(multipleStatements && sql.includes(';'))
  );
}

function isCharsetIndependent(sql) {
  return typeof sql === 'string' && !NON_ASCII.test(sql);
}

function isTransactionOpen(serverStatus) {
  return (
    Boolean(serverStatus & ServerStatus.SERVER_STATUS_IN_TRANS) ||
    !(serverStatus & ServerStatus.SERVER_STATUS_AUTOCOMMIT)
  );
}

module.exports = {
  isSessionNeutral,
  isCharsetIndependent,
  isTransactionOpen,
};
