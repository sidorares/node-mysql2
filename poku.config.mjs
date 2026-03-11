// @ts-check

import { defineConfig } from 'poku';
import { multiSuite } from 'poku/plugins/multi-suite';
import { hasPrivileges } from './tools/common.js';

const commonConfig = defineConfig({
  reporter: 'compact',
  deno: {
    allow: ['all'],
  },
});

const parallel = defineConfig({
  ...commonConfig,
  include: ['test/unit', 'test/integration'],
  timeout: 30000,
  concurrency: 60,
});

const sequential = defineConfig({
  ...commonConfig,
  include: ['test/global'],
  timeout: 60000,
  sequential: true,
  plugins: [
    {
      async discoverFiles(paths) {
        if (!(await hasPrivileges())) {
          console.log('\n› Skipping global tests: insufficient privileges');
          return [];
        }

        return paths;
      },
    },
  ],
});

export default defineConfig({
  plugins: [multiSuite([parallel, sequential])],
});
