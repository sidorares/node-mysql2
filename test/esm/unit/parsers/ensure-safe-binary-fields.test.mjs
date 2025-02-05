import { describe, assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { describeOptions } = require('../../../common.test.cjs');
const getBinaryParser = require('../../../../lib/parsers/binary_parser.js');
const { privateObjectProps } = require('../../../../lib/helpers.js');

describe('Binary Parser: Block Native Object Props', describeOptions);

const blockedFields = Array.from(privateObjectProps).map((prop) => [
  { name: prop, table: '' },
]);

blockedFields.forEach((fields) => {
  try {
    getBinaryParser(fields, {}, {});
    assert.fail('An error was expected');
  } catch (error) {
    assert.strictEqual(
      error.message,
      `The field name (${fields[0].name}) can't be the same as an object's private property.`,
      `Ensure safe ${fields[0].name}`,
    );
  }
});

blockedFields
  .map((fields) =>
    fields.map((field) => ({ ...field, name: field.name.slice(1) })),
  )
  .forEach((fields) => {
    try {
      getBinaryParser(fields, { nestTables: '_' }, {});
      assert.fail('An error was expected');
    } catch (error) {
      assert.strictEqual(
        error.message,
        `The field name (_${fields[0].name}) can't be the same as an object's private property.`,
        `Ensure safe _${fields[0].name} for nestTables as string`,
      );
    }
  });

blockedFields
  .map((fields) =>
    fields.map((field) => ({ ...field, name: '', table: field.name })),
  )
  .forEach((fields) => {
    try {
      getBinaryParser(fields, { nestTables: true }, {});
      assert.fail('An error was expected');
    } catch (error) {
      assert.strictEqual(
        error.message,
        `The field name (${fields[0].table}) can't be the same as an object's private property.`,
        `Ensure safe ${fields[0].table} for nestTables as true`,
      );
    }
  });
