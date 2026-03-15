import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default defineConfig({
  input: 'test/circular/index.mjs',
  output: {
    file: 'test/circular/dist.mjs',
  },
  plugins: [nodeResolve(), commonjs(), json()],
  onwarn(warning, defaultHandler) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      throw new Error(warning.message);
    }
    defaultHandler(warning);
  },
});
