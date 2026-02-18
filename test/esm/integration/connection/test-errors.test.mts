import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

// different error codes for PS, disabling for now
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('Errors', async () => {
  await it('should handle error events correctly', async () => {
    const connection = createConnection();

    let onExecuteResultError: boolean | undefined;
    let onQueryResultError: boolean | undefined;
    let onExecuteErrorEvent: boolean | undefined;
    let onQueryErrorEvent: boolean | undefined;
    let onExecuteErrorEvent1: boolean | undefined;
    let onQueryErrorEvent1: boolean | undefined;

    await new Promise<void>((resolve) => {
      connection
        .execute('error in execute', [], (err) => {
          assert.equal(err?.errno, 1064);
          assert.equal(err?.code, 'ER_PARSE_ERROR');
          // @ts-expect-error: TODO: implement typings
          assert.equal(err?.sql, 'error in execute');
          if (err) {
            onExecuteResultError = true;
          }
        })
        .on('error', () => {
          onExecuteErrorEvent = true;
        });
      connection
        .query('error in query', [], (err) => {
          assert.equal(err?.errno, 1064);
          assert.equal(err?.code, 'ER_PARSE_ERROR');
          // @ts-expect-error: TODO: implement typings
          assert.equal(err?.sql, 'error in query');
          if (err) {
            onQueryResultError = true;
          }
        })
        .on('error', () => {
          onQueryErrorEvent = true;
        });
      connection.execute('error in execute 1', []).on('error', () => {
        onExecuteErrorEvent1 = true;
      });
      connection.query('error in query 1').on('error', () => {
        onQueryErrorEvent1 = true;
        connection.end();
        resolve();
      });
    });

    assert.equal(onExecuteResultError, true);
    assert.equal(onQueryResultError, true);
    assert.equal(onExecuteErrorEvent, undefined);
    assert.equal(onQueryErrorEvent, undefined);
    assert.equal(onExecuteErrorEvent1, true);
    assert.equal(onQueryErrorEvent1, true);
  });
});
