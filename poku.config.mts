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
  exclude: [/test[\\/]esm[\\/]global/],
  concurrency: 4,
});

const sequential = defineConfig({
  ...commonConfig,
  concurrency: 1,
});

const suite = process.env.SUITE === 'global' ? sequential : parallel;

export default suite;
