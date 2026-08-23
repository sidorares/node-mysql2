import { describe, it, strict } from 'poku';
import CharsetToEncoding from '../../../lib/constants/charset_encodings.js';

describe('MariaDB collation id encodings', () => {
  it('should map NO PAD collations like their PAD SPACE counterparts', () => {
    // utf8mb4_nopad_bin = utf8mb4_bin (46) + 1024
    strict.equal(CharsetToEncoding[1070], CharsetToEncoding[46]);
    // latin1_swedish_nopad_ci = latin1_swedish_ci (8) + 1024
    strict.equal(CharsetToEncoding[1032], CharsetToEncoding[8]);
    // big5_chinese_nopad_ci = big5_chinese_ci (1) + 1024
    strict.equal(CharsetToEncoding[1025], CharsetToEncoding[1]);
  });

  it('should map UCA-14.0.0 collation blocks to their character sets', () => {
    strict.equal(CharsetToEncoding[2048], 'cesu8'); // utf8mb3_uca1400_ai_ci
    strict.equal(CharsetToEncoding[2304], 'utf8'); // utf8mb4_uca1400_ai_ci
    strict.equal(CharsetToEncoding[2559], 'utf8'); // utf8mb4 block end
    strict.equal(CharsetToEncoding[2560], 'ucs2'); // ucs2_uca1400_ai_ci
    strict.equal(CharsetToEncoding[2816], 'utf16'); // utf16_uca1400_ai_ci
    strict.equal(CharsetToEncoding[3072], 'utf32'); // utf32_uca1400_ai_ci
  });

  it('should keep MySQL collation ids unchanged', () => {
    strict.equal(CharsetToEncoding[33], 'cesu8'); // utf8_general_ci
    strict.equal(CharsetToEncoding[45], 'utf8'); // utf8mb4_general_ci
    strict.equal(CharsetToEncoding[63], 'binary');
    strict.equal(CharsetToEncoding[224], 'utf8'); // utf8mb4_unicode_ci
  });
});
