'use strict';

const { assert } = require('poku');
const Quit = require('../../../lib/commands/quit');

const testCallback = (err) => console.info(err.message);
const testQuit = new Quit(testCallback);

assert.strictEqual(testQuit.onResult, testCallback);
