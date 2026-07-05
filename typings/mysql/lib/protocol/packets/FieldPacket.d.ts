declare interface FieldPacket {
  constructor: {
    name: 'FieldPacket';
  };
  catalog: string;
  charsetNr?: number;
  db?: string;
  schema?: string;
  characterSet?: number;
  decimals: number;
  default?: any;
  flags: number | string[];
  length?: number;
  name: string;
  orgName: string;
  orgTable: string;
  protocol41?: boolean;
  table: string;
  type?: number;
  columnType?: number;
  zerofill?: boolean;
  typeName?: string;
  encoding?: string;
  columnLength?: number;
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
}

export { FieldPacket };
