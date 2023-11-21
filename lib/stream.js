"use strict"

/**
 * Get a socket stream compatible with the current runtime environment.
 * @returns {Socket}
 */
module.exports.getStream = function getStream(ssl = false) {
  const net = require('net')
  if (typeof net.Socket === 'function') {
    return net.Socket()
  }
  const { CloudflareSocket } = require('pg-cloudflare')
  return new CloudflareSocket(ssl);
}

/**
 * Get a TLS secured socket, compatible with the current environment,
 * using the socket and other settings given in `options`.
 */
module.exports.secureStream = function secureStream(connection) {
  const Tls = require('tls');
  if (Tls.connect) {
    connection.startTLS(err => {
      // after connection is secure
      if (err) {
        // SSL negotiation error are fatal
        err.code = 'HANDSHAKE_SSL_ERROR';
        err.fatal = true;
        this.emit('error', err);
      }
    });
    return
  }
  try {
    // Configuration of TLS will not work in Cloudflare Workers because startTls doesn't have the corresponding options.
    // See https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/#opportunistic-tls-starttls
    connection.stream.startTls({expectedServerHostname: connection.config.host});
  }catch (err) {
    // SSL negotiation error are fatal
    err.code = 'HANDSHAKE_SSL_ERROR';
    err.fatal = true;
    this.emit('error', err);
  }
}
