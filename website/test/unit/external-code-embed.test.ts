/**
 * Fixtures generated using './test/utils/gen-expected-extract-results.ts'
 */

import fs from 'node:fs';
import path from 'node:path';
import { assert } from 'poku';
import {
  extractMethodContent,
  MethodType,
} from '@site/helpers/extract-method-content';

const resource = fs.readFileSync(
  path.resolve('./test/resources/external-code-embed/random-methods.txt'),
  'utf-8'
);

const checkResult = (methodName: string, methodType: MethodType) => {
  if (
    fs.readFileSync(
      path.resolve(`./test/fixtures/external-code-embed/${methodName}.txt`),
      'utf-8'
    ) !== extractMethodContent(resource, methodName, methodType)
  )
    assert.fail(`${methodName} example failed`);
};

// Valid methods
checkResult('QueryOptions', 'interface');
checkResult('Pool', 'class');
checkResult('makeSelector', 'const');
checkResult('handleCompressedPacket', 'function');
checkResult('HistoryRecords', 'type');
checkResult('handler', 'function');

// Invalid method
if (resource !== extractMethodContent(resource, 'invalidMethod', 'function')) {
  assert.fail(
    "Invalid method example failed. It should return the original content when it didn't find the requested method."
  );
}
