import { describe, it, strict } from 'poku';
import Execute from '../../../lib/commands/execute.js';
import Prepare from '../../../lib/commands/prepare.js';

describe('Execute local excess-arity failure lifecycle', () => {
  for (const callback of [true, false]) {
    it(
      callback
        ? 'completes the callback command'
        : 'completes the error-event command',
      () => {
        let writes = 0;
        let failures = 0;
        let ends = 0;
        let failure: unknown;
        const timers: ReturnType<typeof setTimeout>[] = [];
        const command = new Execute(
          {
            statement: { id: 1, parameterCount: 3, parameters: [{}, {}, {}] },
            values: [27, 28, 29, 30],
            timeout: 60000,
          },
          callback
            ? (error: unknown) => {
                failures++;
                failure = error;
              }
            : undefined
        );
        if (!callback)
          command.on('error', (error: unknown) => {
            failures++;
            failure = error;
          });
        command.on('end', () => ends++);
        // @ts-expect-error: internal access
        const startTimer = command._setTimeout.bind(command);
        // @ts-expect-error: internal access
        command._setTimeout = () => {
          startTimer();
          timers.push(command.queryTimeout);
        };
        const connection = {
          config: { charsetNumber: 45, timezone: 'Z', clientFlags: 0 },
          serverCapabilityFlags: 0,
          _resetSequenceId: () => {},
          writePacket: () => {
            writes++;
          },
        };
        const completed = command.execute(null, connection);
        strict.equal(completed, true);
        strict.equal(writes, 0);
        strict.equal(failures, 1);
        strict.equal(ends, 1);
        if (!(failure instanceof RangeError))
          throw new Error('Expected local arity error');
        strict.equal(command.queryTimeout, null);
        strict.equal(timers.length, 1);
        strict.equal(Reflect.get(timers[0], '_destroyed'), true);
        strict.equal('errno' in failure, false);
        strict.equal('sqlState' in failure, false);
      }
    );
  }

  it('counts array holes as positions', () => {
    const parameters = new Array(4);
    parameters[3] = 1;
    const command = new Execute(
      {
        statement: { id: 1, parameterCount: 3, parameters: [{}, {}, {}] },
        values: parameters,
      },
      (error: Error) => {
        strict.equal(error.name, 'RangeError');
        strict.equal(
          error.message,
          'Too many bind parameters: expected at most 3, received 4'
        );
      }
    );
    strict.equal(
      command.execute(null, {
        config: { charsetNumber: 45, clientFlags: 0 },
        _resetSequenceId: () => {},
        writePacket: () => {
          throw new Error('Unexpected execution');
        },
      }),
      true
    );
  });

  it('does not count separate query attributes as SQL bind positions', () => {
    let writes = 0;
    const command = new Execute(
      {
        statement: { id: 1, parameterCount: 1, parameters: [{}] },
        values: [7],
        attributes: { first: 'tag', second: 8 },
      },
      () => {
        throw new Error('Unexpected local rejection');
      }
    );
    strict.equal(
      command.execute(null, {
        config: { charsetNumber: 45, timezone: 'Z', clientFlags: 0 },
        serverCapabilityFlags: 0,
        _resetSequenceId: () => {},
        writePacket: () => {
          writes++;
        },
      }),
      false
    );
    strict.equal(writes, 1);
  });
  it('retains the server header count when definition records are incomplete', () => {
    const prepare = new Prepare({ sql: 'SELECT ? ORDER BY ?' });
    prepare.parameterCount = 2;
    prepare.parameterDefinitions = [{}];
    let statement:
      { parameterCount: number; parameters: unknown[] } | undefined;
    prepare.onResult = (_error: unknown, result: typeof statement) => {
      statement = result;
    };
    prepare.prepareDone({ _statements: { set: () => {} } });
    if (!statement) throw new Error('Expected prepared statement');
    strict.equal(statement.parameterCount, 2);
    strict.equal(statement.parameters.length, 1);
    let writes = 0;
    const connection = {
      config: { charsetNumber: 45, timezone: 'Z', clientFlags: 0 },
      serverCapabilityFlags: 0,
      _resetSequenceId: () => {},
      writePacket: () => {
        writes++;
      },
    };
    const valid = new Execute({ statement, values: [1, 2] }, () => {
      throw new Error('Valid positions must not be rejected');
    });
    strict.equal(valid.execute(null, connection), false);
    strict.equal(writes, 1);
    let rejected = 0;
    const excess = new Execute(
      { statement, values: [1, 2, 3] },
      (error: Error) => {
        strict.equal(error.name, 'RangeError');
        rejected++;
      }
    );
    strict.equal(excess.execute(null, connection), true);
    strict.equal(rejected, 1);
    strict.equal(writes, 1);
  });
});
