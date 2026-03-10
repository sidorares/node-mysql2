// @ts-check

import { exit } from 'node:process';
import { createConnection } from 'mysql2/promise';
import { defineConfig } from 'poku';
import { definePlugin } from 'poku/plugins';

const hasPrivileges = async () => {
  const conn = await createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: (process.env.CI ? process.env.MYSQL_PASSWORD : '') || '',
    port: Number(process.env.MYSQL_PORT) || 3306,
  });

  try {
    await conn.query('SET GLOBAL wait_timeout = @@GLOBAL.wait_timeout');
    return true;
  } catch (err) {
    if (err instanceof Error && 'errno' in err && err.errno === 1227) {
      return false;
    }
    throw err;
  } finally {
    await conn.end().catch(() => {});
  }
};

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
  concurrency: 48,
});

const sequential = defineConfig({
  ...commonConfig,
  timeout: 60000,
  concurrency: 1,
  plugins: [setup.sequential],
});

const suite = process.env.SUITE === 'global' ? sequential : parallel;

export default suite;
