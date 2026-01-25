'use strict'

const { assert } = require('poku');
const common = require('../../common.test.cjs')
const ClientFlags = require('../../../lib/constants/client')
const ConnectionConfig = require('../../../lib/connection_config')

const validFlagName = "MULTI_STATEMENTS"; // ClientFlags.FOUND_ROWS;
const invalidFlagName = "DEPRECATE_EOF"; // This flag is not a value that exists in the ClientFlags constants.

const conn = common.createConnection({
    flags: [validFlagName, invalidFlagName]
});

// multi statement works due to client capability
conn.query('SELECT 1 as result; SELECT 2 as test', (err, rows, fields) => {
    assert.ifError(err);
    assert.deepEqual(rows, [
        [{ result: 1 }],
        [{ test: 2 }]
    ]);
    assert.equal(fields[0][0].name, 'result');
    assert.equal(fields[1][0].name, 'test');
    // 12252111
    // 12317647
    const expectedFlags = ConnectionConfig.mergeFlags(ConnectionConfig.getDefaultFlags(), [validFlagName]);
    const actualFlags = conn.config.clientFlags;

    assert.equal(
        actualFlags,
        expectedFlags,
        'only supported client capability flags are applied'
    );
    conn.end((err) => {
        assert.ifError(err);
        process.exit(0);
    });
});
