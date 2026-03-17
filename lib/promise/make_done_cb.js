'use strict';

function assignError(localErr, err) {
  localErr.message = err.message;
  localErr.code = err.code;
  localErr.errno = err.errno;
  localErr.fatal = err.fatal;
  localErr.sql = err.sql;
  localErr.sqlState = err.sqlState;
  localErr.sqlMessage = err.sqlMessage;
}

function makeDoneCb(resolve, reject, localErr) {
  return function (err, rows, fields) {
    if (err) {
      assignError(localErr, err);
      reject(localErr);
    } else {
      resolve([rows, fields]);
    }
  };
}

module.exports = makeDoneCb;
module.exports.assignError = assignError;
