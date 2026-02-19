import { EOL } from 'node:os';
import { assert, describe, it, listFiles } from 'poku';

await describe('Check for invalid file types found in restricted directories', async () => {
  const invalidFiles: string[] = [];
  const message: string[] = [];

  const checkExtensions = async (
    dirs: string[],
    allowedExtensions: RegExp,
    ignoreList: RegExp = /\.DS_Store|\.json/
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

  await checkExtensions(
    ['test/unit', 'test/integration', 'test/regressions', 'test/global'],
    /\.test\.mts$/
  );
  await checkExtensions(['test/tsc-build'], /(\.test\.ts|tsconfig\.json)$/);

  it(() => {
    assert.deepStrictEqual(
      invalidFiles.length,
      0,
      Array.from(new Set(message)).join(EOL) ||
        'All files have valid extensions'
    );
  });
});
