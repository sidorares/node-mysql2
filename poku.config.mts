import { defineConfig } from 'poku';

export default defineConfig({
  debug: true,
  reporter: 'verbose',
  deno: {
    allow: ['read', 'env', 'net', 'sys'],
  },
});
