module.exports =
{
  CLIENT_LONG_PASSWORD:	1	,/* new more secure passwords */
  CLIENT_FOUND_ROWS:	2	,/* Found instead of affected rows */
  CLIENT_LONG_FLAG:	4	,/* Get all column flags */
  CLIENT_CONNECT_WITH_DB:	8	,/* One can specify db on connect */
  CLIENT_NO_SCHEMA:	16	,/* Don't allow database.table.column */
  CLIENT_COMPRESS:		32	,/* Can use compression protocol */
  CLIENT_ODBC:		64	,/* Odbc client */
  CLIENT_LOCAL_FILES:	128	,/* Can use LOAD DATA LOCAL */
  CLIENT_IGNORE_SPACE:	256	,/* Ignore spaces before '(' */
  CLIENT_PROTOCOL_41:	512	,/* New 4.1 protocol */
  CLIENT_INTERACTIVE:	1024	,/* This is an interactive client */
  CLIENT_SSL:              2048	,/* Switch to SSL after handshake */
  CLIENT_IGNORE_SIGPIPE:   4096    ,/* IGNORE sigpipes */
  CLIENT_TRANSACTIONS:	8192	,/* Client knows about transactions */
  CLIENT_RESERVED:         16384   ,/* Old flag for 4.1 protocol  */
  CLIENT_SECURE_CONNECTION: 32768  ,/* New 4.1 authentication */
  CLIENT_MULTI_STATEMENTS: 65536   ,/* Enable/disable multi-stmt support */
  CLIENT_MULTI_RESULTS:    131072  /* Enable/disable multi-results */
};
