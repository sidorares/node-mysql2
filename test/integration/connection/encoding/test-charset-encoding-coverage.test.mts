import { assert, describe, it } from 'poku';
import mysql from '../../../../index.js';

await describe('Charset to Encoding coverage', async () => {
  const charsets = mysql.Charsets;
  const encodings = mysql.CharsetToEncoding;

  await it('every charset ID should have a defined encoding', async () => {
    const missing: string[] = [];
    const seen = new Set<number>();

    for (const [name, id] of Object.entries(charsets)) {
      if (typeof id !== 'number' || seen.has(id)) continue;

      seen.add(id);
      if (encodings[id] === undefined) missing.push(`${name} (id=${id})`);
    }

    assert.deepStrictEqual(
      missing,
      [],
      `Missing encoding mappings: ${missing.join(', ')}`
    );
  });
});
