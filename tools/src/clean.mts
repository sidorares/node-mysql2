import { rm } from 'node:fs/promises';
import { dist } from './paths.mts';

await rm(dist, { recursive: true, force: true });
