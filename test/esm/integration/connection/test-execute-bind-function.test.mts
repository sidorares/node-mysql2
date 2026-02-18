import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

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

process.on('exit', () => {
  assert(error instanceof Error, 'Expected TypeError to be thrown');
  if (!error) {
    return;
  }
  assert.equal(error.name, 'TypeError');
  if (!error.message.match(/function/)) {
    assert.fail("Expected error.message to contain 'function'");
  }
});
