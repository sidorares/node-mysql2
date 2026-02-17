// TODO: `namedPlaceholders` can't be disabled at query level
import { assert, it, describe } from 'poku';
import { createConnection, createPool } from '../common.test.mjs';

await describe('Test namedPlaceholder as command parameter in connection', async () => {
  const query =
    'SELECT result FROM (SELECT 1 as result) temp WHERE temp.result=:named';
  const values = { named: 1 };

  // await it(async () => {
  //   const c = createConnection({ namedPlaceholders: true }).promise();

  //   try {
  //     await c.query({ sql: query, namedPlaceholders: false }, values);
  //     assert.fail('Enabled in connection config, disabled in query command');
  //   } catch (err) {
  //     assert(
  //       err?.sqlMessage.match(/right syntax to use near ':named'/),
  //       'Enabled in connection config, disabled in query command',
  //     );
  //   } finally {
  //     await c.end();
  //   }
  // });

  await it(async () => {
    const c = createConnection({ namedPlaceholders: false }).promise();

    const [rows] = await c.query(
      { sql: query, namedPlaceholders: true },
      values
    );
    await c.end();

    assert.equal(
      rows[0].result,
      1,
      'Disabled in connection config, enabled in query command'
    );
  });

  // await it(async () => {
  //   const c = createConnection({ namedPlaceholders: true }).promise();

  //   try {
  //     await c.execute({ sql: query, namedPlaceholders: false }, values);
  //     assert.fail('Enabled in connection config, disabled in execute command');
  //   } catch (err) {
  //     assert(
  //       err?.sqlMessage.match(/right syntax to use near ':named'/),
  //       'Enabled in connection config, disabled in execute command',
  //     );
  //   } finally {
  //     await c.end();
  //   }
  // });

  await it(async () => {
    const c = createConnection({ namedPlaceholders: false }).promise();

    const [rows] = await c.execute(
      { sql: query, namedPlaceholders: true },
      values
    );
    await c.end();

    assert.equal(
      rows[0].result,
      1,
      'Disabled in connection config, enabled in execute command'
    );
  });

  // await it(async () => {
  //   const c = createPool({ namedPlaceholders: true }).promise();

  //   try {
  //     await c.query({ sql: query, namedPlaceholders: false }, values);
  //     assert.fail('Enabled in pool config, disabled in query command');
  //   } catch (err) {
  //     assert(
  //       err?.sqlMessage.match(/right syntax to use near ':named'/),
  //       'Enabled in pool config, disabled in query command',
  //     );
  //   } finally {
  //     await c.end();
  //   }
  // });

  await it(async () => {
    const c = createPool({ namedPlaceholders: false }).promise();

    const [rows] = await c.query(
      { sql: query, namedPlaceholders: true },
      values
    );
    await c.end();

    assert.equal(
      rows[0].result,
      1,
      'Disabled in pool config, enabled in query command'
    );
  });

  // await it(async () => {
  //   const c = createPool({ namedPlaceholders: true }).promise();

  //   try {
  //     await c.execute({ sql: query, namedPlaceholders: false }, values);
  //     assert.fail('Enabled in pool config, disabled in execute command');
  //   } catch (err) {
  //     assert(
  //       err?.sqlMessage.match(/right syntax to use near ':named'/),
  //       'Enabled in pool config, disabled in execute command',
  //     );
  //   } finally {
  //     await c.end();
  //   }
  // });

  await it(async () => {
    const c = createPool({ namedPlaceholders: false }).promise();

    const [rows] = await c.execute(
      { sql: query, namedPlaceholders: true },
      values
    );
    await c.end();

    assert.equal(
      rows[0].result,
      1,
      'Disabled in pool config, enabled in execute command'
    );
  });
});
