var mysql = require('../index.js');

var conn = mysql.createConnection({
});

var iconv = require('iconv-lite');

var charsets = []

// TODO: add encodings missing in iconv-lite
// "dec8","hp8","swe7","ujis","keybcs2","utf32","geostd8"

// see also https://github.com/ashtuchkin/iconv-lite/issues/125
// https://en.wikipedia.org/wiki/Kamenick%C3%BD_encoding
// https://github.com/twitter/mysql/tree/master/sql/share/charsets

var mysql2iconv = {
  utf8: 'cesu8',
  utf8mb4: 'utf8',
  // need to check that this is correct mapping
  macce: 'macintosh', // Mac Central European
  eucjpms: 'eucjp'    // UJIS for Windows Japanese
};

var missing = {};

conn.query('show collation', function(err, res) {
  res.forEach( r => {
    var charset = r.Charset;
    var iconvCharset = mysql2iconv[charset] || charset; // if there is manuall mapping, override
    if (!iconv.encodingExists(iconvCharset)) {
      missing[iconvCharset] = 1;
    }
    charsets[r.Id] = iconvCharset;
  });
  //console.log(JSON.stringify(missing, 4, null));
  //console.log(JSON.stringify(charsets, 4, null));
  for (var i=0; i < charsets.length; i+=8) {
    console.log("  '" + charsets.slice(i, i+8).join("', '") + "',");
  }
});

conn.end();

