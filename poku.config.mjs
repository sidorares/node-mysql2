// @ts-check

import { exit } from 'node:process';
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
      async setup() {
        if (!(await hasPrivileges())) {
          console.log('❌ Skipping global tests: insufficient privileges');
          exit(0);
        }
      },
    },
  ],
});

export default defineConfig({
  plugins: [multiSuite([parallel, sequential])],
});
