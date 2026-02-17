import { describe, it, assert } from 'poku';
import getBinaryParser from '../../../../lib/parsers/binary_parser.js';
import { privateObjectProps } from '../../../../lib/helpers.js';

describe('Binary Parser: Block Native Object Props', () => {
  const blockedFields = Array.from(privateObjectProps).map((prop: string) => [
    { name: prop, table: '' },
  ]);

  it(() => {
    blockedFields.forEach((fields: any) => {
      try {
        getBinaryParser(fields, {}, {});
        assert.fail('An error was expected');
      } catch (error: any) {
        assert.strictEqual(
          error.message,
          `The field name (${fields[0].name}) can't be the same as an object's private property.`,
          `Ensure safe ${fields[0].name}`
        );
      }
    });
  });

  it(() => {
    blockedFields
      .map((fields: any) =>
        fields.map((field: any) => ({ ...field, name: field.name.slice(1) }))
      )
      .forEach((fields: any) => {
        try {
          getBinaryParser(fields, { nestTables: '_' }, {});
          assert.fail('An error was expected');
        } catch (error: any) {
          assert.strictEqual(
            error.message,
            `The field name (_${fields[0].name}) can't be the same as an object's private property.`,
            `Ensure safe _${fields[0].name} for nestTables as string`
          );
        }
      });
  });

  it(() => {
    blockedFields
      .map((fields: any) =>
        fields.map((field: any) => ({ ...field, name: '', table: field.name }))
      )
      .forEach((fields: any) => {
        try {
          getBinaryParser(fields, { nestTables: true }, {});
          assert.fail('An error was expected');
        } catch (error: any) {
          assert.strictEqual(
            error.message,
            `The field name (${fields[0].table}) can't be the same as an object's private property.`,
            `Ensure safe ${fields[0].table} for nestTables as true`
          );
        }
      });
  });
});
