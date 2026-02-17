import type { Connection, QueryError } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let connection2: Connection | undefined;

connection.once('connect', () => {
  // @ts-expect-error: TODO: implement typings
  connection.connect((err: QueryError | null, _connection: Connection) => {
    if (err) {
      throw err;
    }
    connection2 = _connection;
    connection.end();
  });
});

process.on('exit', () => {
  assert.equal(connection, connection2);
});
