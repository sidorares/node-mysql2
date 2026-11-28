import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import ConnectionConfig from '../../../lib/connection_config.js';
import CharsetToEncoding from '../../../lib/constants/charset_encodings.js';
import Charsets from '../../../lib/constants/charsets.js';
import StringParser from '../../../lib/parsers/string.js';

const unsupported = {
  armscii8: ['ARMSCII8', 'ARMSCII8_GENERAL_CI', 'ARMSCII8_BIN'],
  dec8: ['DEC8', 'DEC8_SWEDISH_CI', 'DEC8_BIN'],
  eucjpms: ['EUCJPMS', 'EUCJPMS_JAPANESE_CI', 'EUCJPMS_BIN'],
  geostd8: ['GEOSTD8', 'GEOSTD8_GENERAL_CI', 'GEOSTD8_BIN'],
  keybcs2: ['KEYBCS2', 'KEYBCS2_GENERAL_CI', 'KEYBCS2_BIN'],
  swe7: ['SWE7', 'SWE7_SWEDISH_CI', 'SWE7_BIN'],
};

const rejects = (charset: string) => (err: unknown) =>
  err instanceof TypeError &&
  err.message.startsWith(`Unsupported charset '${charset}'`);

describe('Charsets without a matching encoder', () => {
  for (const [charset, names] of Object.entries(unsupported)) {
    it(`rejects ${charset} by name`, () => {
      for (const name of names) {
        strict.throws(
          () => new ConnectionConfig({ charset: name }),
          rejects(charset),
          name
        );
        strict.throws(
          () => new ConnectionConfig({ charset: name.toLowerCase() }),
          rejects(charset),
          name.toLowerCase()
        );
      }
    });

    it(`rejects ${charset} by number, including MariaDB NO PAD ids`, () => {
      for (const name of names) {
        const charsetNumber = Charsets[name as keyof typeof Charsets];
        for (const id of [charsetNumber, charsetNumber + 1024]) {
          strict.equal(CharsetToEncoding[id], charset);
          strict.throws(
            () => new ConnectionConfig({ charsetNumber: id }),
            rejects(charset),
            String(id)
          );
        }
      }
    });

    it(`rejects ${charset} before opening a socket`, () => {
      strict.throws(
        () => mysql.createConnection({ charset: names[0], port: 1 }),
        rejects(charset)
      );
      strict.throws(
        () => mysql.createPool({ charset: names[0], port: 1 }),
        rejects(charset)
      );
      strict.throws(
        () =>
          mysql.createConnection(
            `mysql://root@127.0.0.1:1/test?charset=${names[0]}`
          ),
        rejects(charset)
      );
    });
  }

  it('keeps accepting supported charsets', () => {
    for (const charset of ['UTF8MB4', 'LATIN1', 'CP1251', 'UJIS', 'HP8']) {
      strict.doesNotThrow(() => new ConnectionConfig({ charset }), charset);
    }
    strict.doesNotThrow(() => new ConnectionConfig({}));
  });
});

describe('HP8 maps to hproman8', () => {
  // MySQL 8.3 hp8 bytes 0xA0 to 0xFE; 0xFF has no character
  const mysqlUpperHalf =
    ' ÀÂÈÊËÎÏ´ˋˆ¨˜ÙÛ₤¯Ýý°ÇçÑñ¡¿¤£¥§ƒ¢âêôûáéóúàèòùäëöüÅîØÆåíøæÄìÖÜÉïßÔÁÃãÐðÍÌÓÒÕõŠšÚŸÿÞþ·µ¶¾—¼½ªº«■»±';
  const upperBytes = Buffer.from(
    Array.from({ length: 0xff - 0xa0 }, (_, i) => 0xa0 + i)
  );
  const ascii = Buffer.from(Array.from({ length: 0x80 }, (_, i) => i));

  it('maps every hp8 collation id to hproman8', () => {
    for (const id of [Charsets.HP8_ENGLISH_CI, Charsets.HP8_BIN]) {
      strict.equal(CharsetToEncoding[id], 'hproman8');
      strict.equal(CharsetToEncoding[id + 1024], 'hproman8');
    }
  });

  it('encodes ASCII to itself', () => {
    strict.deepEqual(
      StringParser.encode(ascii.toString('latin1'), 'hproman8'),
      ascii
    );
  });

  it("encodes and decodes like MySQL's hp8 table", () => {
    strict.deepEqual(
      StringParser.encode(mysqlUpperHalf, 'hproman8'),
      upperBytes
    );
    strict.equal(
      StringParser.decode(upperBytes, 'hproman8', 0, upperBytes.length),
      mysqlUpperHalf
    );
  });
});
