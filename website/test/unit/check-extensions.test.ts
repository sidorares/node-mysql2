import { EOL } from 'node:os';
import { listFiles, it, strict } from 'poku';

const invalidFiles: string[] = [];
const message = [
  'Check for invalid file types found in restricted directories',
];

const checkExtensions = async (
  dirs: string[],
  allowedExtensions: RegExp,
  ignoreList: RegExp = /\.DS_Store/u
) => {
  for (const dir of dirs) {
    const files = await listFiles(dir, { filter: /\./u });

    for (const file of files) {
      if (!(ignoreList.test(file) || allowedExtensions.test(file))) {
        invalidFiles.push(file);
        message.push(`${EOL}${String(allowedExtensions)}`);
        message.push(`- ${file}`);
      }
    }
  }
};

it(async () => {
  await checkExtensions(['docs', 'i18n'], /\.(?:mdx|json)$/u);
  await checkExtensions(['helpers', 'plugins'], /\.ts$/u);
  await checkExtensions(['test/unit', 'test/utils'], /\.test\.ts$/u);
  await checkExtensions(['src/components', 'src/pages'], /\.tsx$/u);
  await checkExtensions(['src/css'], /\.scss$/u);

  strict.deepStrictEqual(
    invalidFiles.length,
    0,
    Array.from(new Set(message)).join(EOL)
  );
});
