import { describe, it, assert } from 'poku';
import { TextRowParser, privateObjectProps } from '../../common.test.mjs';

describe('Text Parser: Block Native Object Props', () => {
  const blockedFields = Array.from(privateObjectProps).map((prop) => [
    { name: prop, table: '' },
  ]);

  it(() => {
    blockedFields.forEach((fields) => {
      try {
        TextRowParser(fields, {}, {});
        assert.fail('An error was expected');
      } catch (error) {
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
      .map((fields) =>
        fields.map((field) => ({ ...field, name: field.name.slice(1) }))
      )
      .forEach((fields) => {
        try {
          TextRowParser(fields, { nestTables: '_' }, {});
          assert.fail('An error was expected');
        } catch (error) {
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
      .map((fields) =>
        fields.map((field) => ({ ...field, name: '', table: field.name }))
      )
      .forEach((fields) => {
        try {
          TextRowParser(fields, { nestTables: true }, {});
          assert.fail('An error was expected');
        } catch (error) {
          assert.strictEqual(
            error.message,
            `The field name (${fields[0].table}) can't be the same as an object's private property.`,
            `Ensure safe ${fields[0].table} for nestTables as true`
          );
        }
      });
  });
});
