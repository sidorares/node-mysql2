import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

describe('Execute Bind Undefined', () => {
  const connection = createConnection();

  let error: Error | null = null;

  try {
    connection.execute('SELECT ? AS result', [undefined], () => {});
  } catch (err) {
    if (err instanceof Error) {
      error = err;
    } else {
      throw err;
    }
    connection.end();
  }

  it('should throw TypeError for undefined parameter', () => {
    assert(error instanceof Error, 'Expected TypeError to be thrown');
    if (!error) {
      return;
    }
    assert.equal(error.name, 'TypeError');
    if (!error.message.match(/undefined/)) {
      assert.fail("Expected error.message to contain 'undefined'");
    }
  });
});
