declare interface RowDataPacket {
  constructor: {
    name: 'RowDataPacket';
  };
  [column: string]: any;
  [column: number]: any;
}

export default RowDataPacket;
