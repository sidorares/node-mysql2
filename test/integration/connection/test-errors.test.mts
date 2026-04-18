import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale: different error codes');
}

await describe('Errors', async () => {
  const connection = createConnection();

  await it('should handle error events correctly', async () => {
    const result = await new Promise<{
      executeErr: { errno?: number; code?: string; sql?: string } | null;
      queryErr: { errno?: number; code?: string; sql?: string } | null;
      onExecuteErrorEvent: boolean | undefined;
      onQueryErrorEvent: boolean | undefined;
      onExecuteErrorEvent1: boolean | undefined;
      onQueryErrorEvent1: boolean | undefined;
    }>((resolve) => {
      let executeErr: { errno?: number; code?: string; sql?: string } | null =
        null;
      let queryErr: { errno?: number; code?: string; sql?: string } | null =
        null;
      let onExecuteErrorEvent: boolean | undefined;
      let onQueryErrorEvent: boolean | undefined;
      let onExecuteErrorEvent1: boolean | undefined;
      let onQueryErrorEvent1: boolean | undefined;

      connection
        .execute('error in execute', [], (err) => {
          if (err) {
            executeErr = {
              errno: err.errno,
              code: err.code,
              // @ts-expect-error: TODO: implement typings
              sql: err.sql as string,
            };
          }
        })
        .on('error', () => {
          onExecuteErrorEvent = true;
        });
      connection
        .query('error in query', [], (err) => {
          if (err) {
            queryErr = {
              errno: err.errno,
              code: err.code,
              // @ts-expect-error: TODO: implement typings
              sql: err.sql as string,
            };
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
        resolve({
          executeErr,
          queryErr,
          onExecuteErrorEvent,
          onQueryErrorEvent,
          onExecuteErrorEvent1,
          onQueryErrorEvent1,
        });
      });
    });

    strict.equal(result.executeErr?.errno, 1064);
    strict.equal(result.executeErr?.code, 'ER_PARSE_ERROR');
    strict.equal(result.executeErr?.sql, 'error in execute');
    strict.equal(result.queryErr?.errno, 1064);
    strict.equal(result.queryErr?.code, 'ER_PARSE_ERROR');
    strict.equal(result.queryErr?.sql, 'error in query');
    strict.equal(result.onExecuteErrorEvent, undefined);
    strict.equal(result.onQueryErrorEvent, undefined);
    strict.equal(result.onExecuteErrorEvent1, true);
    strict.equal(result.onQueryErrorEvent1, true);
  });

  connection.end();
});
