import { describe, assert } from 'poku';
import { describeOptions } from '../../../common.test.cjs';
import getBinaryParser from '../../../../lib/parsers/binary_parser.js';
import { srcEscape } from '../../../../lib/helpers.js';
import { nativeObjectProps } from '../../../../lib/helpers.js';

describe('Binary Parser: Block Native Object Props', describeOptions);

const blockedFields = nativeObjectProps.map((prop) => [{ name: prop }]);

blockedFields.forEach((fields) => {
  try {
    getBinaryParser(fields, {}, {});
    assert.fail('An error were expected');
  } catch (error) {
    assert.strictEqual(
      error.message,
      `The field name (${srcEscape(fields[0].name)}) cannot be the same as the property of a native object.`,
      `Ensure safe ${fields[0].name}`,
    );
  }
});
