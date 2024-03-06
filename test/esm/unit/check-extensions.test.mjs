import { EOL } from 'node:os';
import { listFiles, assert } from 'poku';

const invalidFiles = [];
const message = [
  'Check for invalid file types found in restricted directories',
];

const checkExtensions = (
  dirs,
  allowedExtensions,
  ignoreList = /\.DS_Store/,
) => {
  dirs.forEach((dir) => {
    const files = listFiles(dir, { filter: /\./ });

    files.forEach((file) => {
      if (!ignoreList.test(file) && !allowedExtensions.test(file)) {
        invalidFiles.push(file);
        message.push(`${EOL}${String(allowedExtensions)}`);
        message.push(`- ${file}`);
      }
    });
  });
};

checkExtensions(['test/unit', 'test/integration'], /\.test\.cjs$/);
checkExtensions(['test/esm'], /\.test\.mjs$/);
checkExtensions(['test/tsc-build'], /(\.test\.ts|tsconfig\.json)$/);

assert.deepStrictEqual(
  invalidFiles.length,
  0,
  Array.from(new Set(message)).join(EOL),
);
