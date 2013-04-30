// Manually extracted from mysql-5.5.23/include/mysql_com.h
exports.LONG_PASSWORD     = 1; /* new more secure passwords */
exports.FOUND_ROWS        = 2; /* Found instead of affected rows */
exports.LONG_FLAG         = 4; /* Get all column flags */
exports.CONNECT_WITH_DB   = 8; /* One can specify db on connect */
exports.NO_SCHEMA         = 16; /* Don't allow database.table.column */
exports.COMPRESS          = 32; /* Can use compression protocol */
exports.ODBC              = 64; /* Odbc client */
exports.LOCAL_FILES       = 128; /* Can use LOAD DATA LOCAL */
exports.IGNORE_SPACE      = 256; /* Ignore spaces before '(' */
exports.PROTOCOL_41       = 512; /* New 4.1 protocol */
exports.INTERACTIVE       = 1024; /* This is an interactive client */
exports.SSL               = 2048; /* Switch to SSL after handshake */
exports.IGNORE_SIGPIPE    = 4096;    /* IGNORE sigpipes */
exports.TRANSACTIONS      = 8192; /* Client knows about transactions */
exports.RESERVED          = 16384;   /* Old flag for 4.1 protocol  */
exports.SECURE_CONNECTION = 32768;  /* New 4.1 authentication */

exports.MULTI_STATEMENTS = 65536; /* Enable/disable multi-stmt support */
exports.MULTI_RESULTS    = 131072; /* Enable/disable multi-results */
exports.PS_MULTI_RESULTS = 262144; /* Multi-results in PS-protocol */

exports.PLUGIN_AUTH = 524288; /* Client supports plugin authentication */

exports.SSL_VERIFY_SERVER_CERT = 1073741824;
exports.REMEMBER_OPTIONS       = 2147483648;
