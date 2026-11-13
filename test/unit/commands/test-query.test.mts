import { describe, it, strict } from 'poku';
import Query from '../../../lib/commands/query.js';

const rowPacket = { isEOF: () => false };
const eofPacket = { isEOF: () => true, eofStatusFlags: () => 0 };

const createFailingQuery = (thrown: unknown) => {
  const reported: Array<[Error | null, unknown]> = [];
  const query = new Query({}, (err: Error | null, res: unknown) => {
    reported.push([err, res]);
  });

  query._rowParser = new (class FailingRowParser {
    next() {
      throw thrown;
    }
  })();

  return { query, reported };
};

describe('Query command', () => {
  it('should report a row parser error once the result set ends', () => {
    const testError = new Error('something happened');
    const { query, reported } = createFailingQuery(testError);

    query.row(rowPacket);
    query.row(rowPacket);
    strict.deepEqual(reported, [], 'rows are still arriving');

    query.row(eofPacket);
    strict.deepEqual(reported, [[testError, null]]);
  });

  it('should report an error when the row parser throws a falsy value', () => {
    const { query, reported } = createFailingQuery(null);

    query.row(rowPacket);
    query.row(eofPacket);

    strict.equal(reported.length, 1);
    strict.ok(reported[0][0] instanceof Error);
  });
});
