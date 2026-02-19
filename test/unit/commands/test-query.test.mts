import { assert, describe, it } from 'poku';
import Query from '../../../lib/commands/query.js';

describe('Query command', () => {
  it('should pass error to callback when row parser throws', () => {
    const testError = new Error('something happened');
    const testQuery = new Query({}, (err: Error | null, res: unknown) => {
      assert.equal(err, testError);
      assert.equal(res, null);
    });

    testQuery._rowParser = new (class FailingRowParser {
      next() {
        throw testError;
      }
    })();

    testQuery.row({
      isEOF: () => false,
    });
  });
});
