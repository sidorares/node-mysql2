// @ts-check

import { createRequire } from 'node:module';
import { exit } from 'node:process';
import { defineConfig } from 'poku';
import { definePlugin } from 'poku/plugins';

const require = createRequire(import.meta.url);
const { hasPrivileges } = require('./tools/common.js');

const setup = {
  sequential: definePlugin({
    name: 'setup',
    async setup() {
      if (!(await hasPrivileges())) {
        console.log('❌ Skipping global tests: insufficient privileges');
        exit(0);
      }
    },
  }),
};

const commonConfig = defineConfig({
  reporter: 'compact',
  deno: {
    allow: ['all'],
  },
});

const parallel = defineConfig({
  ...commonConfig,
  timeout: 30000,
  exclude: [/test[\\/]global/, /test[\\/]tsc-build/],
  concurrency: 8,
});

const sequential = defineConfig({
  ...commonConfig,
  timeout: 60000,
  concurrency: 1,
  plugins: [setup.sequential],
});

const suite = process.env.SUITE === 'global' ? sequential : parallel;

export default suite;
