import { mysqlp as mysql } from '../../index.js';

const BIG5_CHINESE_CI: number = mysql.Charsets.BIG5_CHINESE_CI;
const BIG5: number = mysql.Charsets.BIG5;

console.log(BIG5_CHINESE_CI, BIG5);
