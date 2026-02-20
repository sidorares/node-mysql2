import type { ResultSetHeader } from '../../../index.js';
import process from 'node:process';
import { assert, describe, it, skip } from 'poku';
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
  skip('Skipping test for PlanetScale');
}

await describe('Track State Change', async () => {
  const connection = createConnection();

  await it('should track state changes for charset and schema', async () => {
    let result1!: CharsetStateChangeResult;
    let result2!: SchemaStateChangeResult;

    await new Promise<void>((resolve, reject) => {
      connection.query<CharsetStateChangeResult>(
        'SET NAMES koi8r',
        (err, _ok) => {
          if (err) return reject(err);
          result1 = _ok;
        }
      );

      connection.query<SchemaStateChangeResult>('USE mysql', (err, _ok) => {
        if (err) return reject(err);
        result2 = _ok;
        connection.end();
        resolve();
      });
    });

    assert.deepEqual(result1.stateChanges.systemVariables, {
      character_set_connection: 'koi8r',
      character_set_client: 'koi8r',
      character_set_results: 'koi8r',
    });
    assert.deepEqual(result2.stateChanges.schema, 'mysql');
  });
});
