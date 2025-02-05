import { EOL } from 'node:os';
import { listFiles, test, assert } from 'poku';

const invalidFiles: string[] = [];
const message = [
  'Check for invalid file types found in restricted directories',
];

const checkExtensions = async (
  dirs: string[],
  allowedExtensions: RegExp,
  ignoreList: RegExp = /\.DS_Store/
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
  await checkExtensions(['docs', 'i18n'], /\.(mdx|json)$/);
  await checkExtensions(['helpers', 'plugins'], /\.ts$/);
  await checkExtensions(['test/unit', 'test/utils'], /\.test\.ts$/);
  await checkExtensions(['src/components', 'src/pages'], /\.tsx$/);
  await checkExtensions(['src/css'], /\.scss$/);

  assert.deepStrictEqual(
    invalidFiles.length,
    0,
    Array.from(new Set(message)).join(EOL)
  );
});
