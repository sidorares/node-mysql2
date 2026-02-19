import { assert, describe, it } from 'poku';
import { privateObjectProps } from '../../../lib/helpers.js';
import getBinaryParser from '../../../lib/parsers/binary_parser.js';

describe('Binary Parser: Block Native Object Props', () => {
  const blockedFields: { name: string; table: string }[][] = Array.from(
    privateObjectProps
  ).map((prop) => [{ name: prop, table: '' }]);

  it(() => {
    blockedFields.forEach((fields) => {
      try {
        getBinaryParser(fields, {}, {});
        assert.fail('An error was expected');
      } catch (error: unknown) {
        assert.strictEqual(
          (error as Error).message,
          `The field name (${fields[0].name}) can't be the same as an object's private property.`,
          `Ensure safe ${fields[0].name}`
        );
      }
    });
  });

  it(() => {
    blockedFields
      .map((fields) =>
        fields.map((field) => ({ ...field, name: field.name.slice(1) }))
      )
      .forEach((fields) => {
        try {
          getBinaryParser(fields, { nestTables: '_' }, {});
          assert.fail('An error was expected');
        } catch (error: unknown) {
          assert.strictEqual(
            (error as Error).message,
            `The field name (_${fields[0].name}) can't be the same as an object's private property.`,
            `Ensure safe _${fields[0].name} for nestTables as string`
          );
        }
      });
  });

  it(() => {
    blockedFields
      .map((fields) =>
        fields.map((field) => ({ ...field, name: '', table: field.name }))
      )
      .forEach((fields) => {
        try {
          getBinaryParser(fields, { nestTables: true }, {});
          assert.fail('An error was expected');
        } catch (error: unknown) {
          assert.strictEqual(
            (error as Error).message,
            `The field name (${fields[0].table}) can't be the same as an object's private property.`,
            `Ensure safe ${fields[0].table} for nestTables as true`
          );
        }
      });
  });
});
