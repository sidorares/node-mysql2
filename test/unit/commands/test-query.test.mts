import { describe, it, strict } from 'poku';
import Query from '../../../lib/commands/query.js';

const rowPacket = { isEOF: () => false };
const lastEOFPacket = { isEOF: () => true, eofStatusFlags: () => 0 };
const connection = { serverStatus: 0 };

class FailingRowParser {
  calls = 0;
  error: Error;

  constructor(error: Error) {
    this.error = error;
  }

  next() {
    this.calls++;
    throw this.error;
  }
}

describe('Query command', () => {
  it('should pass the row parser error to the callback once the result ends', () => {
    const testError = new Error('something happened');
    const calls: unknown[][] = [];
    const testQuery = new Query({}, (...args: unknown[]) => calls.push(args));
    const rowParser = new FailingRowParser(testError);

    testQuery._rowParser = rowParser;

    strict.equal(testQuery.row(rowPacket), Query.prototype.row);
    strict.equal(testQuery.row(rowPacket), Query.prototype.row);
    strict.equal(rowParser.calls, 1);
    strict.deepEqual(calls, []);

    strict.equal(testQuery.row(lastEOFPacket, connection), null);
    strict.deepEqual(calls, [[testError]]);
  });

  it('should emit the row parser error once the result ends', () => {
    const testError = new Error('something happened');
    const errors: unknown[] = [];
    const testQuery = new Query({});
    testQuery.on('error', (error: unknown) => errors.push(error));
    testQuery.on('result', () => strict.fail('no row after the failure'));

    testQuery._rowParser = new FailingRowParser(testError);

    testQuery.row(rowPacket);
    testQuery.row(rowPacket);
    strict.deepEqual(errors, []);

    strict.equal(testQuery.row(lastEOFPacket, connection), null);
    strict.deepEqual(errors, [testError]);
  });
});
