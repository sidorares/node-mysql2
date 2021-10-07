'use strict'

module.exports = pluginOptions => ({ connection, command }) => {
  const password =
    command.password || pluginOptions.password || connection.config.password;

  return Buffer.from(`${password}\0`)
};