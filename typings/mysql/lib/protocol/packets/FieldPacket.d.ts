declare interface FieldPacket {
  constructor: {
    name: 'FieldPacket';
  };
  catalog: string;
  schema: string;
  characterSet: number;
  decimals: number;
  flags: string[];
  name: string;
  orgName: string;
  orgTable: string;
  table: string;
  type: number;
  typeName: string;
  encoding: string;
  columnLength: number;
}

export { FieldPacket };
