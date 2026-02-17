import type { ResultSetHeader } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type CharsetStateChangeResult = ResultSetHeader & {
  stateChanges: {
    systemVariables: {
      character_set_connection: string;
      character_set_client: string;
      character_set_results: string;
    };
  };
};

type SchemaStateChangeResult = ResultSetHeader & {
  stateChanges: {
    schema: string;
  };
};

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const connection = createConnection();

let result1: CharsetStateChangeResult, result2: SchemaStateChangeResult;

connection.query<CharsetStateChangeResult>('SET NAMES koi8r', (err, _ok) => {
  assert.ifError(err);
  result1 = _ok;
});

connection.query<SchemaStateChangeResult>('USE mysql', (err, _ok) => {
  assert.ifError(err);
  result2 = _ok;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(result1.stateChanges.systemVariables, {
    character_set_connection: 'koi8r',
    character_set_client: 'koi8r',
    character_set_results: 'koi8r',
  });
  assert.deepEqual(result2.stateChanges.schema, 'mysql');
});
