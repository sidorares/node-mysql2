import { join, resolve } from 'node:path';

export const root = resolve(import.meta.dirname, '../..');
export const dist = join(root, 'dist');
