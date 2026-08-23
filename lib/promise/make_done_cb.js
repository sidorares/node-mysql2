'use strict';

const { applyCapturedStack } = require('./capture_local_err.js');

function makeDoneCb(resolve, reject, stackHolder) {
  return function (err, rows, fields) {
    if (err) {
      applyCapturedStack(err, stackHolder);
      reject(err);
    } else {
      resolve([rows, fields]);
    }
  };
}

module.exports = makeDoneCb;
