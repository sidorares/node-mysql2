'use strict';

// MariaDB-specific extended capability flags.
//
// MariaDB servers (10.2+) do not set the CLIENT_MYSQL (LONG_PASSWORD)
// capability and instead use 4 reserved bytes of the initial handshake packet
// to advertise these flags. Clients answer with their own extended
// capabilities in the last 4 reserved bytes of the handshake response
// (the server only reads them when the client leaves CLIENT_MYSQL unset).
//
// The flags below are the lower 32 bits shifted down, i.e.
// MARIADB_CLIENT_PROGRESS is documented as 1 << 32.
// https://mariadb.com/docs/server/reference/clientserver-protocol/1-connecting/connection
exports.MARIADB_CLIENT_PROGRESS = 0x00000001;
exports.MARIADB_CLIENT_COM_MULTI = 0x00000002; /* deprecated */
exports.MARIADB_CLIENT_STMT_BULK_OPERATIONS = 0x00000004;
exports.MARIADB_CLIENT_EXTENDED_METADATA = 0x00000008;
exports.MARIADB_CLIENT_CACHE_METADATA = 0x00000010;
exports.MARIADB_CLIENT_BULK_UNIT_RESULTS = 0x00000020;
