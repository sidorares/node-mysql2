import fs from 'node:fs';
import path from 'node:path';
import { EOL } from 'node:os';

const checkExtensions = (
  directoriesToCheck: string[],
  allowedExtensions: string[],
  ignoreList: string[] = ['.DS_Store']
) => {
  const isIgnored = (fileName: string): boolean => {
    return (
      ignoreList.includes(fileName) ||
      allowedExtensions.includes(path.extname(fileName))
    );
  };

  const findInvalidFiles = (dir: string): string[] => {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((file) => {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) return findInvalidFiles(fullPath);
      if (file.isFile() && !isIgnored(file.name)) return [fullPath];

      return [];
    });
  };

  const invalidFiles = directoriesToCheck.flatMap((dir) =>
    findInvalidFiles(dir)
  );

  if (invalidFiles.length > 0) {
    console.log(
      '❌ Invalid file types found in restricted directories:',
      invalidFiles,
      EOL,
      `  Please ensure that files in these directories have one of the following extensions: ${allowedExtensions.join(
        ', '
      )}.`
    );
    process.exit(1);
  }
};

checkExtensions(['docs', 'i18n'], ['.mdx', '.json']);
checkExtensions(['helpers', 'plugins', 'test/unit', 'test/utils'], ['.ts']);
checkExtensions(['src/components', 'src/pages'], ['.tsx']);
checkExtensions(['src/css'], ['.scss']);
