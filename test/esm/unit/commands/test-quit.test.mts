import { assert } from 'poku';
import Quit from '../../../../lib/commands/quit.js';

const testCallback = (err: Error) => console.info(err.message);
const testQuit = new Quit(testCallback);

assert.strictEqual(testQuit.onResult, testCallback);
