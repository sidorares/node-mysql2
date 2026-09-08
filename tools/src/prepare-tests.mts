import { access, copyFile, cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { exit } from 'node:process';
import { dist, root } from './paths.mts';

try {
  await access(join(dist, 'index.js'));
} catch {
  console.error(
    'dist/index.js not found. Run "npm run src:build" after transcribing src/index.ts.'
  );
  exit(1);
}

await rm(join(dist, 'test'), { recursive: true, force: true });
await cp(join(root, 'test'), join(dist, 'test'), { recursive: true });
await copyFile(join(root, 'package.json'), join(dist, 'package.json'));
