import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Error Events', async () => {
  await it('should handle error events without uncaught exceptions', async () => {
    let callCount = 0;

    const connection1 = createConnection({
      password: 'lol',
    });

    const connection2 = createConnection({
      password: 'lol',
    });

    await new Promise<void>((resolve) => {
      // error will NOT bubble up to process level if `on` is used
      connection1.on('error', () => {
        callCount++;
        if (callCount === 2) resolve();
      });

      // error will bubble up to process level if `once` is used
      connection2.once('error', () => {
        callCount++;
        if (callCount === 2) resolve();
      });
    });

    assert.equal(callCount, 2);
  });
});
