import { mysqlp as mysql } from '../../index.js';

const BLOB: number = mysql.Types.BLOB;
const DECIMAL: string = mysql.Types[0x00];
const DOUBLE: string = mysql.Types[5];

console.log(BLOB, DECIMAL, DOUBLE);
