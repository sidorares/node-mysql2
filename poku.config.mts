import { defineConfig } from 'poku';

const commonConfig = defineConfig({
  debug: true,
  reporter: 'compact',
  deno: {
    allow: ['read', 'env', 'net', 'sys'],
  },
});

const parallel = defineConfig({
  ...commonConfig,
  include: 'test/esm',
  exclude: [/test[\\/]esm[\\/]global/],
  concurrency: 4,
});

const sequential = defineConfig({
  ...commonConfig,
  include: 'test/esm/global',
  concurrency: 1,
});

const suite = process.env.SUITE;

export default suite === 'global' ? sequential : parallel;
