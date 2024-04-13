import { describe, assert } from 'poku';
import { describeOptions } from '../../../common.test.cjs';
import getBinaryParser from '../../../../lib/parsers/binary_parser.js';
import { srcEscape } from '../../../../lib/helpers.js';

describe(
  'Binary Parser (Long Term): Block Native Object Props',
  describeOptions,
);

const emptyObject = {};
const proto = Object.getPrototypeOf(emptyObject);
const nativeObjectProps = Object.getOwnPropertyNames(proto);

const blockedFields = nativeObjectProps.map((prop) => [{ name: prop }]);

blockedFields.forEach((fields) => {
  try {
    getBinaryParser(fields, {}, {});
    assert.fail('An error was expected');
  } catch (error) {
    assert.strictEqual(
      error.message,
      `The field name (${srcEscape(fields[0].name)}) cannot be the same as the property of a native object.`,
      `Ensure safe ${fields[0].name}`,
    );
  }
});
