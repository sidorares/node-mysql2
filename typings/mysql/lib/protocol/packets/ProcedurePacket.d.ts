import { OkPacket } from './OkPacket.js';
import { ResultSetHeader } from './ResultSetHeader.js';
import { RowDataPacket } from './RowDataPacket.js';

declare type ProcedureCallPacket<
  T extends
    | OkPacket
    | ResultSetHeader
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[] =
    | OkPacket
    | ResultSetHeader
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[]
> = [T, ResultSetHeader];

export { ProcedureCallPacket };
