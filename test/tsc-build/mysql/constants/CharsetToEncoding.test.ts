import { mysql } from '../../index.test.js';

const charsetToEncoding: string[] = mysql.CharsetToEncoding;
const utf8: string = charsetToEncoding[0];

console.log(utf8, charsetToEncoding);
