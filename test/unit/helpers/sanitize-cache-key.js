'use strict';

const assert = require('assert');
const helpers = require('../../../lib/helpers.js');

assert.deepStrictEqual(helpers.sanitizeKey(), '_');
assert.deepStrictEqual(helpers.sanitizeKey(undefined), '_');
assert.deepStrictEqual(helpers.sanitizeKey(null), 'null');
assert.deepStrictEqual(helpers.sanitizeKey(false), 'false');
assert.deepStrictEqual(helpers.sanitizeKey(true), 'true');
assert.deepStrictEqual(helpers.sanitizeKey('text'), 'text');
assert.deepStrictEqual(helpers.sanitizeKey('_'), '__');
assert.deepStrictEqual(helpers.sanitizeKey('__'), '____');
assert.deepStrictEqual(helpers.sanitizeKey(":", ':'), '_');
assert.deepStrictEqual(helpers.sanitizeKey("/", '/'), '_');
assert.deepStrictEqual(helpers.sanitizeKey(":", '/'), ':');
assert.deepStrictEqual(helpers.sanitizeKey("/", ':'), '/');
assert.deepStrictEqual(helpers.sanitizeKey(16), '16');
assert.deepStrictEqual(helpers.sanitizeKey(16_000), '16000');
assert.deepStrictEqual(helpers.sanitizeKey(5e52), '5e+52');
assert.deepStrictEqual(helpers.sanitizeKey(98756123165498765321654987n), '98756123165498765321654987');
