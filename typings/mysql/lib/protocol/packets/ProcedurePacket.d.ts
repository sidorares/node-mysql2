import { OkPacket } from './OkPacket.js';
import { ResultSetHeader } from './ResultSetHeader.js';
import { RowDataPacket } from './RowDataPacket.js';

declare type ProcedureCallPacket<
  T = RowDataPacket[] | RowDataPacket[][] | ResultSetHeader
> = T extends RowDataPacket[]
  ? [...T, ResultSetHeader]
  : T extends RowDataPacket[][]
  ? [...T, ResultSetHeader]
  : T extends ResultSetHeader | OkPacket | OkPacket[]
  ? ResultSetHeader
  :
      | [...RowDataPacket[], ResultSetHeader]
      | [...RowDataPacket[][], ResultSetHeader]
      | ResultSetHeader;

export { ProcedureCallPacket };
