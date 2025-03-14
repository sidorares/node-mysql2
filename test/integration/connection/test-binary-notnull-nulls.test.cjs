'use strict';

const { assert } = require('poku');

const common = require('../../common.test.cjs');
const conn = common.createConnection();

// it's possible to receive null values for columns marked with NOT_NULL flag
// see https://github.com/sidorares/node-mysql2/issues/178 for info

conn.query('set sql_mode=""');

conn.query(
  'CREATE TEMPORARY TABLE `tmp_account` ( ' +
    ' `id` int(11) NOT NULL AUTO_INCREMENT, ' +
    ' `username` varchar(64) NOT NULL, ' +
    ' `auth_code` varchar(30) NOT NULL, ' +
    ' `access_token` varchar(30) NOT NULL, ' +
    ' `refresh_token` tinytext NOT NULL, ' +
    ' PRIMARY KEY (`id`) ' +
    ' ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8'
);
conn.query("INSERT INTO `tmp_account` VALUES ('1', 'xgredx', '', '', '')");

conn.query(
  'CREATE TEMPORARY TABLE `tmp_account_flags` ( ' +
    ' `account` int(11) NOT NULL, ' +
    ' `flag` tinyint(3) NOT NULL, ' +
    ' PRIMARY KEY (`account`,`flag`) ' +
    ' ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8'
);

conn.query("INSERT INTO `tmp_account_flags` VALUES ('1', '100')");

conn.query(
  'CREATE TEMPORARY TABLE `tmp_account_session` ( ' +
    ' `account` int(11) NOT NULL, ' +
    ' `ip` varchar(15) NOT NULL, ' +
    ' `session` varchar(114) NOT NULL, ' +
    ' `time` int(11) NOT NULL, ' +
    ' PRIMARY KEY (`account`,`ip`) ' +
    ' ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8'
);

conn.query(
  "INSERT INTO `tmp_account_session` VALUES ('1', '::1', '75efb145482ce22f4544390cad233c749c1b43e4', '1')"
);

conn.connect((err) => {
  if (err) {
    console.error(err);
    return;
  }

  conn.execute(
    "SELECT `ac`.`username`, CONCAT('[', GROUP_CONCAT(DISTINCT `acf`.`flag` SEPARATOR ','), ']') flags FROM tmp_account ac LEFT JOIN tmp_account_flags acf ON `acf`.account = `ac`.id LEFT JOIN tmp_account_session acs ON `acs`.account = `ac`.id WHERE `acs`.`session`=?",
    ['asid=75efb145482ce22f4544390cad233c749c1b43e4'],
    (err, rows, fields) => {
      /*
      this assertion is valid for mysql8 < 8.0.17 and not longer valid in 8.0.18
      TODO: investigate why and remove
      const flagNotNull = fields[0].flags & FieldFlags.NOT_NULL;
      const valueIsNull = rows[0][fields[0].name] === null;
      assert(flagNotNull && valueIsNull);
      */

      const valueIsNull = rows[0][fields[0].name] === null;
      assert(valueIsNull);
      conn.end();
    }
  );
});
