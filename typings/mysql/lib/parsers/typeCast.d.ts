export type Geometry = {
  x: number;
  y: number;
};

export type Type = {
  type:
    | 'DECIMAL'
    | 'TINY'
    | 'SHORT'
    | 'LONG'
    | 'FLOAT'
    | 'DOUBLE'
    | 'NULL'
    | 'TIMESTAMP'
    | 'TIMESTAMP2'
    | 'LONGLONG'
    | 'INT24'
    | 'DATE'
    | 'TIME'
    | 'TIME2'
    | 'DATETIME'
    | 'DATETIME2'
    | 'YEAR'
    | 'NEWDATE'
    | 'VARCHAR'
    | 'BIT'
    | 'VECTOR'
    | 'JSON'
    | 'NEWDECIMAL'
    | 'ENUM'
    | 'SET'
    | 'TINY_BLOB'
    | 'MEDIUM_BLOB'
    | 'LONG_BLOB'
    | 'BLOB'
    | 'VAR_STRING'
    | 'STRING'
    | 'GEOMETRY';
};

export type Field = Type & {
  /**
   * MariaDB extended data type name (e.g. `uuid`, `inet4`, `inet6`, `point`),
   * available when the server supports the MARIADB_CLIENT_EXTENDED_METADATA
   * capability (MariaDB 10.5+)
   */
  extendedTypeName?: string;
  /**
   * MariaDB extended format name (e.g. `json`), available when the server
   * supports the MARIADB_CLIENT_EXTENDED_METADATA capability (MariaDB 10.5+)
   */
  extendedFormat?: string;
  length: number;
  db: string;
  table: string;
  name: string;
  string: (encoding?: BufferEncoding | string | undefined) => string | null;
  buffer: () => Buffer | null;
  geometry: () => Geometry | Geometry[] | null;
};

export type Next = () => unknown;

export type TypeCast = ((field: Field, next: Next) => any) | boolean;
