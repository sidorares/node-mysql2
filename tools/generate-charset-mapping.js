'use strict';

const mysql = require('../index.js');

const conn = mysql.createConnection({
  user: 'mycause_dev',
  password: 'mycause'
});

const iconv = require('iconv-lite');

const charsets = [];

// TODO: add encodings missing in iconv-lite
// "dec8","hp8","swe7","keybcs2","utf32","geostd8"

// see also https://github.com/ashtuchkin/iconv-lite/issues/125
// https://en.wikipedia.org/wiki/Kamenick%C3%BD_encoding
// https://github.com/twitter/mysql/tree/master/sql/share/charsets
// https://github.com/sidorares/node-mysql2/pull/772

const mysql2iconv = {
  utf8: 'cesu8',
  utf8mb4: 'utf8',
  utf16le: 'utf16-le',
  ujis: 'eucjp',
  // need to check that this is correct mapping
  macce: 'macintosh' // Mac Central European
};

const missing = {};

conn.query('show collation', (err, res) => {
  console.log(res);
  res.forEach(r => {
    const charset = r.Charset;
    const iconvCharset = mysql2iconv[charset] || charset; // if there is manuall mapping, override
    if (!iconv.encodingExists(iconvCharset)) {
      missing[iconvCharset] = 1;
    }
    charsets[r.Id] = iconvCharset;
  });
  //console.log(JSON.stringify(missing, 4, null));
  //console.log(JSON.stringify(charsets, 4, null));
  for (let i = 0; i < charsets.length; i += 8) {
    console.log(`  '${charsets.slice(i, i + 8).join("', '")}',`);
  }
});

conn.end();
