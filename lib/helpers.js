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
    [str]: 1
  }).slice(1, -3);
}

exports.srcEscape = srcEscape;

let highlightFn;
let cardinalRecommended = false;
try {
  highlightFn = require('cardinal').highlight;
} catch(err) {
  highlightFn = text => {
    if (!cardinalRecommended) {
      console.log('For nicer debug output consider install cardinal@^2.0.0');
      cardinalRecommended = true;
    }
    return text;
  }
}

/**
 * Prints debug message with code frame, will try to use `cardinal` if available.
 */
function printDebugWithCode(msg, code) {
  console.log(`\n\n${msg}:\n`);
  console.log(highlightFn(code) + '\n');
}

exports.printDebugWithCode = printDebugWithCode;