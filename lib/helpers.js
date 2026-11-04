'use strict';

const Errors = require('./constants/errors.js');

/*

  this seems to be not only shorter, but faster than
  string.replace(/\\/g, '\\\\').
            replace(/\u0008/g, '\\b').
            replace(/\t/g, '\\t').
            replace(/\n/g, '\\n').
            replace(/\f/g, '\\f').
            replace(/\r/g, '\\r').
            replace(/'/g, '\\\'').
            replace(/"/g, '\\"');
  or string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
  see http://jsperf.com/string-escape-regexp-vs-json-stringify
  */
function srcEscape(str) {
  return JSON.stringify({
    [str]: 1,
  }).slice(1, -3);
}

exports.srcEscape = srcEscape;

let highlightFn;
let cardinalRecommended = false;
try {
  // the purpose of this is to prevent projects using Webpack from displaying a warning during runtime if cardinal is not a dependency
  const REQUIRE_TERMINATOR = '';
  highlightFn = require(`cardinal${REQUIRE_TERMINATOR}`).highlight;
} catch {
  highlightFn = (text) => {
    if (!cardinalRecommended) {
      console.log('For nicer debug output consider install cardinal@^2.0.0');
      cardinalRecommended = true;
    }
    return text;
  };
}

/**
 * Prints debug message with code frame, will try to use `cardinal` if available.
 */
function printDebugWithCode(msg, code) {
  console.log(`\n\n${msg}:\n`);
  console.log(`${highlightFn(code)}\n`);
}

exports.printDebugWithCode = printDebugWithCode;

/**
 * checks whether the `type` is in the `list`
 */
function typeMatch(type, list, Types) {
  if (Array.isArray(list)) {
    return list.some((t) => type === Types[t]);
  }

  return !!list;
}

exports.typeMatch = typeMatch;

const privateObjectProps = new Set([
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  '__proto__',
]);

exports.privateObjectProps = privateObjectProps;

const fieldEscape = (field, isEval = true) => {
  if (privateObjectProps.has(field)) {
    throw new Error(
      `The field name (${field}) can't be the same as an object's private property.`
    );
  }

  return isEval ? srcEscape(field) : field;
};
exports.fieldEscape = fieldEscape;

// Source: https://github.com/go-sql-driver/mysql/blob/76c00e35a8d48f8f70f0e7dffe584692bd3fa612/packets.go#L598-L613
function isReadOnlyError(err) {
  if (!err || !err.errno) {
    return false;
  }
  // 1792: ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION
  // 1290: ER_OPTION_PREVENTS_STATEMENT (returned by Aurora during failover)
  // 1836: ER_READ_ONLY_MODE
  return (
    err.errno === Errors.ER_OPTION_PREVENTS_STATEMENT ||
    err.errno === Errors.ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION ||
    err.errno === Errors.ER_READ_ONLY_MODE
  );
}

exports.isReadOnlyError = isReadOnlyError;
