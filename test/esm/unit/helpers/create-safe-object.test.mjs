import { describe, assert } from 'poku';
import { describeOptions } from '../../../common.test.cjs';
import { createSafeObject } from '../../../../lib/helpers.js';

describe('Creating a safe object', describeOptions);

const stdObj = {};
const safeObj = createSafeObject();

assert.deepStrictEqual(stdObj, safeObj, 'Ensure __proto__ is immutable');
assert.throws(() => {
  safeObj.__proto__ = { toString: () => true };
}, 'Ensure safeObject is valid');

stdObj.__proto__ = { toString: () => true };
assert.notDeepStrictEqual(
  stdObj,
  safeObj,
  'Ensure that the object is not the same as the poisoned __proto__',
);
