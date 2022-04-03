'use strict'

module.exports = pluginOptions => ({ connection, command }) => {
  const password =
    command.password || pluginOptions.password || connection.config.password;

  const cleartextPassword = function(password) {
    return Buffer.from(`${password}\0`)
  };

  return cleartextPassword(password)
};