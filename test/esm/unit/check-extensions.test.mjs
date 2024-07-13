import { EOL } from 'node:os';
import { listFiles, test, assert } from 'poku';

const invalidFiles = [];
const message = [
  'Check for invalid file types found in restricted directories',
];

const checkExtensions = async (
  dirs,
  allowedExtensions,
  ignoreList = /\.DS_Store/,
) => {
  for (const dir of dirs) {
    const files = await listFiles(dir, { filter: /\./ });

    for (const file of files) {
      if (!ignoreList.test(file) && !allowedExtensions.test(file)) {
        invalidFiles.push(file);
        message.push(`${EOL}${String(allowedExtensions)}`);
        message.push(`- ${file}`);
      }
    }
  }
};

test(async () => {
  await checkExtensions(['test/unit', 'test/integration'], /\.test\.cjs$/);
  await checkExtensions(['test/esm'], /\.test\.mjs$/);
  await checkExtensions(['test/tsc-build'], /(\.test\.ts|tsconfig\.json)$/);

  assert.deepStrictEqual(
    invalidFiles.length,
    0,
    Array.from(new Set(message)).join(EOL),
  );
});
