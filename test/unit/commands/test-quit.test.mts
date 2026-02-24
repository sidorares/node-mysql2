import { describe, it, strict } from 'poku';
import Quit from '../../../lib/commands/quit.js';

describe('Quit command', () => {
  it('should store callback as onResult', () => {
    const testCallback = (err: Error) => console.info(err.message);
    const testQuit = new Quit(testCallback);

    strict.strictEqual(testQuit.onResult, testCallback);
  });
});
