/**
 * This file is not included in the tests and can be triggered manually using the command:
 * `npx tsx test/utils/gen-expected-extract-results.ts`
 */

import fs from 'node:fs';
import path from 'node:path';
import { extractMethodContent } from '@site/helpers/extract-method-content';

const resource = fs.readFileSync(
  path.resolve('./test/resources/external-code-embed/random-methods.txt'),
  'utf-8'
);

fs.writeFileSync(
  path.resolve('./test/fixtures/external-code-embed/QueryOptions.txt'),
  extractMethodContent(resource, 'QueryOptions', 'interface')
);

fs.writeFileSync(
  path.resolve('./test/fixtures/external-code-embed/Pool.txt'),
  extractMethodContent(resource, 'Pool', 'class')
);

fs.writeFileSync(
  path.resolve('./test/fixtures/external-code-embed/makeSelector.txt'),
  extractMethodContent(resource, 'makeSelector', 'const')
);

fs.writeFileSync(
  path.resolve(
    './test/fixtures/external-code-embed/handleCompressedPacket.txt'
  ),
  extractMethodContent(resource, 'handleCompressedPacket', 'function')
);

fs.writeFileSync(
  path.resolve('./test/fixtures/external-code-embed/HistoryRecords.txt'),
  extractMethodContent(resource, 'HistoryRecords', 'type')
);

fs.writeFileSync(
  path.resolve('./test/fixtures/external-code-embed/handler.txt'),
  extractMethodContent(resource, 'handler', 'function')
);
