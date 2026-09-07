import { multiSuite } from '@pokujs/multi-suite';
import { defineConfig, listFiles } from 'poku';
import { hasPrivileges } from '../common.js';

const commonConfig = defineConfig({
  reporter: 'compact',
  deno: {
    allow: ['all'],
  },
});

const parallel = defineConfig({
  ...commonConfig,
  include: ['dist/test/unit', 'dist/test/integration'],
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

        return listFiles('dist/test/global');
      },
    },
  ],
});

export default defineConfig({
  plugins: [multiSuite([parallel, sequential])],
});
