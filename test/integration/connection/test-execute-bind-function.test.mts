import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

describe('Execute Bind Function', () => {
  const connection = createConnection();

  let error: Error | null = null;

  try {
    connection.execute('SELECT ? AS result', [function () {}], () => {});
  } catch (err) {
    if (err instanceof Error) {
      error = err;
    } else {
      throw err;
    }
    connection.end();
  }

  it('should throw TypeError for function parameter', () => {
    strict(error instanceof Error, 'Expected TypeError to be thrown');
    if (!error) {
      return;
    }
    strict.equal(error.name, 'TypeError');
    if (!error.message.match(/function/)) {
      strict.fail("Expected error.message to contain 'function'");
    }
  });
});
