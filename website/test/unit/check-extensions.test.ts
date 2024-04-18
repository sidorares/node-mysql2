import { EOL } from 'node:os';
import { listFiles, assert } from 'poku';

const invalidFiles: string[] = [];
const message = [
  'Check for invalid file types found in restricted directories',
];

const checkExtensions = (
  dirs: string[],
  allowedExtensions: RegExp,
  ignoreList: RegExp = /\.DS_Store/
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

checkExtensions(['docs', 'i18n'], /\.(mdx|json)$/);
checkExtensions(['helpers', 'plugins'], /\.ts$/);
checkExtensions(['test/unit', 'test/utils'], /\.test\.ts$/);
checkExtensions(['src/components', 'src/pages'], /\.tsx$/);
checkExtensions(['src/css'], /\.scss$/);

assert.deepStrictEqual(
  invalidFiles.length,
  0,
  Array.from(new Set(message)).join(EOL)
);
