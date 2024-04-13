import { describe, assert } from 'poku';
import { describeOptions } from '../../../common.test.cjs';
import TextRowParser from '../../../../lib/parsers/text_parser.js';
import { srcEscape } from '../../../../lib/helpers.js';

describe('Text Parser (Long Term): Block Native Object Props', describeOptions);

const emptyObject = {};
const proto = Object.getPrototypeOf(emptyObject);
const nativeObjectProps = Object.getOwnPropertyNames(proto);

const blockedFields = nativeObjectProps.map((prop) => [{ name: prop }]);

blockedFields.forEach((fields) => {
  try {
    TextRowParser(fields, {}, {});
    assert.fail('An error were expected');
  } catch (error) {
    assert.strictEqual(
      error.message,
      `The field name (${srcEscape(fields[0].name)}) cannot be the same as the property of a native object.`,
      `Ensure safe ${fields[0].name}`,
    );
  }
});
