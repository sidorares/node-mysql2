import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import StringParser from '../../../lib/parsers/string.js';

describe('StringParser.decode', () => {
  const buf = Buffer.from('hello, world', 'latin1');

  it('decodes the fast-path encodings like buffer.toString', () => {
    for (const encoding of ['utf8', 'utf-8', 'latin1', 'binary', 'ascii']) {
      strict.equal(
        StringParser.decode(buf, encoding, 0, 5),
        buf.toString(encoding as BufferEncoding, 0, 5),
        encoding
      );
    }
  });

  it('clamps out-of-range offsets like buffer.toString', () => {
    // end past the buffer
    strict.equal(
      StringParser.decode(buf, 'ascii', 7, buf.length + 100),
      buf.toString('ascii', 7, buf.length + 100)
    );
    // negative start
    strict.equal(
      StringParser.decode(buf, 'utf8', -3, 5),
      buf.toString('utf8', -3, 5)
    );
    // empty and inverted ranges
    strict.equal(StringParser.decode(buf, 'utf8', 5, 5), '');
    strict.equal(StringParser.decode(buf, 'latin1', 9, 2), '');
    strict.equal(
      StringParser.decode(buf, 'ascii', buf.length + 5, buf.length + 10),
      ''
    );
  });

  it('supports other Buffer encodings through toString', () => {
    strict.equal(
      StringParser.decode(buf, 'hex', 0, 5),
      buf.toString('hex', 0, 5)
    );
    strict.equal(
      StringParser.decode(buf, 'base64', 0, 6),
      buf.toString('base64', 0, 6)
    );
  });

  it('decodes iconv encodings with and without options', () => {
    const win1251 = Buffer.from([0xef, 0xf0, 0xe8, 0xe2, 0xe5, 0xf2]);
    strict.equal(
      StringParser.decode(win1251, 'win1251', 0, win1251.length),
      'привет'
    );
    strict.equal(
      StringParser.decode(win1251, 'win1251', 0, win1251.length, {}),
      'привет'
    );
    // decoder is cached: a second call with the same options key
    strict.equal(
      StringParser.decode(win1251, 'win1251', 0, win1251.length, {}),
      'привет'
    );
  });
});
