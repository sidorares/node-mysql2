// @ts-check

import { defineConfig } from 'poku';

const commonConfig = defineConfig({
  reporter: 'compact',
  deno: {
    allow: ['read', 'env', 'net', 'sys'],
  },
});

const parallel = defineConfig({
  ...commonConfig,
  timeout: 30000,
  exclude: [/test[\\/]global/, /test[\\/]tsc-build/],
  concurrency: 0,
});

const sequential = defineConfig({
  ...commonConfig,
  timeout: 60000,
  concurrency: 1,
});

const suite = process.env.SUITE === 'global' ? sequential : parallel;

export default suite;
