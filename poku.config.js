// @ts-check

const { multiSuite } = require('@pokujs/multi-suite');
const { defineConfig, listFiles } = require('poku');
const { hasPrivileges } = require('./tools/common.js');

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
  concurrency: 8,
});

const sequential = defineConfig({
  ...commonConfig,
  timeout: 60000,
  sequential: true,
  plugins: [
    {
      async discoverFiles() {
        if (!(await hasPrivileges())) {
          console.log('\n› Skipping global tests: insufficient privileges');
          return [];
        }

        return listFiles('test/global');
      },
    },
  ],
});

module.exports = defineConfig({
  plugins: [multiSuite([parallel, sequential])],
});
