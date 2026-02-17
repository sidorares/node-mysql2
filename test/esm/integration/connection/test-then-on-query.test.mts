import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let error = true;

const q = connection.query('SELECT 1');
try {
  // @ts-expect-error: testing that .then does not exist on Query
  if (q.then) q.then();
} catch {
  error = false;
}
q.on('end', () => {
  connection.end();
});

process.on('exit', () => {
  assert.equal(error, false);
});
