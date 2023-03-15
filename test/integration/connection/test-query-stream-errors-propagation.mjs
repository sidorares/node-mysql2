import * as common from '../../common.js';
import assert from 'node:assert';

function killConnection(connectionId) {
  const killer = common.createConnection();
  killer.query('KILL ?', [connectionId]);
  killer.end();
}

const connection = await common.createConnectionPromise();
const query = connection.connection.query('SELECT SLEEP(10)');
const stream = query.stream();

// kill the connection
killConnection(connection.threadId);

try {
  // iterate the streaming result here
  for await (const row of stream) {
    // do stuff with row
  }
  assert.fail('The query stream should have thrown the connection error');
} catch (e) {
  assert.ok('The query stream has thrown the connection error');
}
