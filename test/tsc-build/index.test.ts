/**
 * This tests doesn't execute the scripts or connect in any database.
 * It only compiles all typings in the project and ensures that the compilation will be successful.
 * To test it, run: npm run test:tsc-build
 *
 * The purpose of this test is to prevent changes that break the typings in new PRs
 *
 * Contributions:
 *
 * For mysql build tests:           './mysql/...'
 * For mysql/promise build tests:   './promise/...'
 */

import mysql from '../../index.js';
import mysqlp from '../../promise.js';

export { mysql, mysqlp };
