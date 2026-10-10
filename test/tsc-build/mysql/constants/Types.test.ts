import { mysql } from '../../index.test.js';

const BLOB: number = mysql.Types.BLOB;
const DECIMAL: string = mysql.Types[0x00];
const DOUBLE: string = mysql.Types[5];

const typeName = (field: mysql.FieldPacket): string | undefined =>
  field.type === undefined ? undefined : mysql.Types[field.type];

// @ts-expect-error: A type code maps to its name, a string
const BLOB_CODE: number = mysql.Types[BLOB];
