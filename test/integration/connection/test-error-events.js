'use strict';

const common = require('../../common');
const assert = require('assert');

let callCount = 0;
let exceptionCount = 0;

process.on('uncaughtException', err => {
  assert.ifError(err);
  exceptionCount++;
});

const connection1 = common.createConnection({
  password: 'lol'
});

// error will NOT bubble up to process level if `on` is used
connection1.on('error', () => {
  callCount++;
});

const connection2 = common.createConnection({
  password: 'lol'
});

// error will bubble up to process level if `once` is used
connection2.once('error', () => {
  callCount++;
});

process.on('exit', () => {
  assert.equal(callCount, 2);
  assert.equal(exceptionCount, 0);
});
