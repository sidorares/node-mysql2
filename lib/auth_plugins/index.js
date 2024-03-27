'use strict';

module.exports = {
  get caching_sha2_password() {
    return require('./caching_sha2_password');
  },
  get mysql_clear_password() {
    return require('./mysql_clear_password');
  },
  get mysql_native_password() {
    return require('./mysql_native_password');
  },
  get sha256_password() {
    return require('./sha256_password');
  }
};
