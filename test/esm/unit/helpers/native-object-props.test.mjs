import { describe, assert } from 'poku';
import { describeOptions } from '../../../common.test.cjs';
import { nativeObjectProps } from '../../../../lib/helpers.js';

describe(
  'Checking long-term object properties along Node.js versions',
  describeOptions,
);

const emptyObject = {};
const proto = Object.getPrototypeOf(emptyObject);
const expected = Object.getOwnPropertyNames(proto).sort();

assert.strictEqual(
  nativeObjectProps.size,
  expected.length,
  'Ensure objects have the same length',
);
assert.deepStrictEqual(
  Array.from(nativeObjectProps).sort(),
  expected,
  'Ensure long term object properties',
);
