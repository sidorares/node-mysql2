import { assert, describe, it } from 'poku';
import mysql from '../../../../index.js';

describe('Charset to Encoding coverage', () => {
  const charsets = mysql.Charsets;
  const encodings = mysql.CharsetToEncoding;

  it('every charset ID should have a defined encoding', () => {
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
