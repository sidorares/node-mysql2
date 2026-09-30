import { describe, it, strict } from 'poku';
import captureLocalErr from '../../lib/promise/capture_local_err.js';

const { captureStackHolder, applyCapturedStack } = captureLocalErr;

await describe('capture_local_err', async () => {
  await it('should capture on an Error so Bun prepareStackTrace can format it', () => {
    const original = Error.prepareStackTrace;
    let seenErr: Error | undefined;
    Error.prepareStackTrace = (err, traces) => {
      seenErr = err;
      if (!(err instanceof Error)) {
        throw new TypeError('First argument must be an Error object failed');
      }
      return original ? original.call(Error, err, traces) : String(err.stack);
    };
    try {
      const holder = captureStackHolder(captureStackHolder);
      strict.ok(holder instanceof Error, 'holder should be an Error instance');
      const stack = holder.stack ?? '';
      strict.equal(typeof holder.stack, 'string');
      strict.ok(stack.length > 0);
      strict.ok(seenErr instanceof Error);
    } finally {
      Error.prepareStackTrace = original;
    }
  });

  await it('should keep the callback error identity and rewrite its stack', () => {
    function captureHere() {
      return captureStackHolder(captureHere);
    }
    const holder = captureHere();
    const err = new Error('ER_PARSE_ERROR: syntax error') as Error & {
      code?: string;
    };
    err.code = 'ER_PARSE_ERROR';
    applyCapturedStack(err, holder);
    strict.equal(err.code, 'ER_PARSE_ERROR');
    const stack = err.stack ?? '';
    strict.ok(
      stack.startsWith('Error: ER_PARSE_ERROR: syntax error'),
      `unexpected stack:\n${stack}`
    );
    strict.ok(
      stack.includes('test-capture-local-err.test.mts'),
      `expected this test file in the rewritten stack:\n${stack}`
    );
  });
});
