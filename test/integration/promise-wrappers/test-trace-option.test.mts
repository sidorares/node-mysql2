import type { ConnectionOptions } from '../../../index.js';
import process from 'node:process';
import { describe, it, strict } from 'poku';
import promiseDriver from '../../../promise.js';
import { config } from '../../common.test.mjs';

const testFileMarker = 'test-trace-option.test.mts';

const { createConnection, createPoolCluster } = promiseDriver;

const options = (trace: boolean): ConnectionOptions =>
  process.env.MYSQL_CONNECTION_URL
    ? { uri: process.env.MYSQL_CONNECTION_URL, trace }
    : { ...config, trace };

async function rejection(operation: Promise<unknown>): Promise<Error> {
  try {
    await operation;
  } catch (error) {
    return error as Error;
  }

  throw new Error('Expected the operation to reject');
}

function assertPointsAtCaller(error: Error) {
  strict(
    error.stack?.includes(testFileMarker),
    `Expected the stack to reference ${testFileMarker}; got:\n${error.stack}`
  );
}

function assertDoesNotPointAtCaller(error: Error) {
  strict(
    !error.stack?.includes(testFileMarker),
    `Expected \`trace: false\` to leave the stack alone; got:\n${error.stack}`
  );
}

await describe('trace option: prepared statement execute', async () => {
  const traced = await createConnection(options(true));
  const untraced = await createConnection(options(false));
  const tracedStatement = await traced.prepare('SELECT ? AS a');
  const untracedStatement = await untraced.prepare('SELECT ? AS a');

  await it('should capture the caller stack by default', async () => {
    assertPointsAtCaller(await rejection(tracedStatement.execute([])));
  });

  await it('should not capture the caller stack with trace: false', async () => {
    assertDoesNotPointAtCaller(await rejection(untracedStatement.execute([])));
  });

  await traced.end();
  await untraced.end();
});

await describe('trace option: connection lifecycle methods', async () => {
  const traced = await createConnection(options(true));
  const untraced = await createConnection(options(false));

  await it('should capture the caller stack by default', async () => {
    assertPointsAtCaller(await rejection(traced.prepare('syntax error')));
  });

  await it('should not capture the caller stack with trace: false', async () => {
    assertDoesNotPointAtCaller(
      await rejection(untraced.prepare('syntax error'))
    );
  });

  await traced.end();
  await untraced.end();
});

await describe('trace option: pool cluster namespace', async () => {
  const traced = createPoolCluster();
  const untraced = createPoolCluster();

  traced.add('MASTER', options(true));
  untraced.add('MASTER', options(false));

  const tracedNamespace = traced.of('MASTER');
  const untracedNamespace = untraced.of('MASTER');

  await it('should capture the caller stack by default', async () => {
    assertPointsAtCaller(
      await rejection(tracedNamespace.query('SELECT * FROM trace_no_table'))
    );
    assertPointsAtCaller(
      await rejection(tracedNamespace.execute('SELECT * FROM trace_no_table'))
    );
  });

  await it('should not capture the caller stack with trace: false', async () => {
    assertDoesNotPointAtCaller(
      await rejection(untracedNamespace.query('SELECT * FROM trace_no_table'))
    );
    assertDoesNotPointAtCaller(
      await rejection(untracedNamespace.execute('SELECT * FROM trace_no_table'))
    );
  });

  await traced.end();
  await untraced.end();
});
