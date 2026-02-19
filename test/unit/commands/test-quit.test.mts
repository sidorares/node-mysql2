import { assert, describe, it } from 'poku';
import Quit from '../../../lib/commands/quit.js';

describe('Quit command', () => {
  it('should store callback as onResult', () => {
    const testCallback = (err: Error) => console.info(err.message);
    const testQuit = new Quit(testCallback);

    assert.strictEqual(testQuit.onResult, testCallback);
  });
});
