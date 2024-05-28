// TODO: `namedPlaceholders` can't be disabled at query level
import { assert, test, describe } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createConnection,
  describeOptions,
  createPool,
} = require('../../common.test.cjs');

const query =
  'SELECT result FROM (SELECT 1 as result) temp WHERE temp.result=:named';
const values = { named: 1 };

describe(
  'Test namedPlaceholder as command parameter in connection',
  describeOptions,
);

// test(() => {
//   const c = createConnection({ namedPlaceholders: true });

//   c.query({ sql: query, namedPlaceholders: false }, values, (err) => {
//     c.end();

//     assert(
//       err || err?.sqlMessage.match(/right syntax to use near ':named'/),
//       'Enabled in connection config, disabled in query command',
//     );
//   });
// });

test(() => {
  const c = createConnection({ namedPlaceholders: false });

  c.query({ sql: query, namedPlaceholders: true }, values, (err, rows) => {
    c.end();

    assert.ifError(err);
    assert.equal(
      rows[0].result,
      1,
      'Disabled in connection config, enabled in query command',
    );
  });
});

// test(() => {
//   const c = createConnection({ namedPlaceholders: true });

//   c.execute({ sql: query, namedPlaceholders: false }, values, (err) => {
//     c.end();

//     assert(
//       err || err?.sqlMessage.match(/right syntax to use near ':named'/),
//       'Enabled in connection config, disabled in execute command',
//     );
//   });
// });

test(() => {
  const c = createConnection({ namedPlaceholders: false });

  c.execute({ sql: query, namedPlaceholders: true }, values, (err, rows) => {
    c.end();

    assert.ifError(err);
    assert.equal(
      rows[0].result,
      1,
      'Disabled in connection config, enabled in execute command',
    );
  });
});

// test(() => {
//   const c = createPool({ namedPlaceholders: true });

//   c.query({ sql: query, namedPlaceholders: false }, values, (err) => {
//     c.end();

//     assert(
//       err || err?.sqlMessage.match(/right syntax to use near ':named'/),
//       'Enabled in pool config, disabled in query command',
//     );
//   });
// });

test(() => {
  const c = createPool({ namedPlaceholders: false });

  c.query({ sql: query, namedPlaceholders: true }, values, (err, rows) => {
    c.end();

    assert.ifError(err);
    assert.equal(
      rows[0].result,
      1,
      'Disabled in pool config, enabled in query command',
    );
  });
});

// test(() => {
//   const c = createPool({ namedPlaceholders: true });

//   c.execute({ sql: query, namedPlaceholders: false }, values, (err) => {
//     c.end();

//     assert(
//       err || err?.sqlMessage.match(/right syntax to use near ':named'/),
//       'Enabled in pool config, disabled in execute command',
//     );
//   });
// });

test(() => {
  const c = createPool({ namedPlaceholders: false });

  c.execute({ sql: query, namedPlaceholders: true }, values, (err, rows) => {
    c.end();

    assert.ifError(err);
    assert.equal(
      rows[0].result,
      1,
      'Disabled in pool config, enabled in execute command',
    );
  });
});
