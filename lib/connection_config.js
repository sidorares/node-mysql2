'use strict';

const urlParse = require('url').parse;
const ClientConstants = require('./constants/client');
const Charsets = require('./constants/charsets');
let SSLProfiles = null;

const validOptions = {
  authSwitchHandler: 1,
  bigNumberStrings: 1,
  charset: 1,
  charsetNumber: 1,
  compress: 1,
  connectAttributes: 1,
  connectTimeout: 1,
  database: 1,
  dateStrings: 1,
  debug: 1,
  decimalNumbers: 1,
  flags: 1,
  host: 1,
  insecureAuth: 1,
  isServer: 1,
  localAddress: 1,
  maxPreparedStatements: 1,
  multipleStatements: 1,
  namedPlaceholders: 1,
  nestTables: 1,
  password: 1,
  passwordSha1: 1,
  pool: 1,
  port: 1,
  queryFormat: 1,
  rowsAsArray: 1,
  socketPath: 1,
  ssl: 1,
  stream: 1,
  stringifyObjects: 1,
  supportBigNumbers: 1,
  timezone: 1,
  trace: 1,
  typeCast: 1,
  uri: 1,
  user: 1,
  // These options are used for Pool
  connectionLimit: 1,
  Promise: 1,
  queueLimit: 1,
  waitForConnections: 1
};

class ConnectionConfig {
  constructor(options) {
    if (typeof options === 'string') {
      options = ConnectionConfig.parseUrl(options);
    } else if (options && options.uri) {
      const uriOptions = ConnectionConfig.parseUrl(options.uri);
      for (const key in uriOptions) {
        if (!Object.prototype.hasOwnProperty.call(uriOptions, key)) continue;
        if (options[key]) continue;
        options[key] = uriOptions[key];
      }
    }
    for (const key in options) {
      if (!Object.prototype.hasOwnProperty.call(options, key)) continue;
      if (validOptions[key] !== 1) {
        // REVIEW: Should this be emitted somehow?
        // eslint-disable-next-line no-console
        console.error(
          `Ignoring invalid configuration option passed to Connection: ${key}. This is currently a warning, but in future versions of MySQL2, an error will be thrown if you pass an invalid configuration option to a Connection`
        );
      }
    }
    this.isServer = options.isServer;
    this.stream = options.stream;
    this.host = options.host || 'localhost';
    this.port = options.port || 3306;
    this.localAddress = options.localAddress;
    this.socketPath = options.socketPath;
    this.user = options.user || undefined;
    this.password = options.password || undefined;
    this.passwordSha1 = options.passwordSha1 || undefined;
    this.database = options.database;
    this.connectTimeout =
      options.connectTimeout === undefined ? 10 * 1000 : options.connectTimeout;
    this.insecureAuth = options.insecureAuth || false;
    this.supportBigNumbers = options.supportBigNumbers || false;
    this.bigNumberStrings = options.bigNumberStrings || false;
    this.decimalNumbers = options.decimalNumbers || false;
    this.dateStrings = options.dateStrings || false;
    this.debug = options.debug;
    this.trace = options.trace !== false;
    this.stringifyObjects = options.stringifyObjects || false;
    if (
      options.timezone &&
      !/^(?:local|Z|[ +-]\d\d:\d\d)$/.test(options.timezone)
    ) {
      // strictly supports timezones specified by mysqljs/mysql:
      // https://github.com/mysqljs/mysql#user-content-connection-options
      // eslint-disable-next-line no-console
      console.error(
        `Ignoring invalid timezone passed to Connection: ${options.timezone}. This is currently a warning, but in future versions of MySQL2, an error will be thrown if you pass an invalid configuration option to a Connection`
      );
      // SqlStrings falls back to UTC on invalid timezone
      this.timezone = 'Z';
    } else {
      this.timezone = options.timezone || 'local';
    }
    this.queryFormat = options.queryFormat;
    this.pool = options.pool || undefined;
    this.ssl =
      typeof options.ssl === 'string'
        ? ConnectionConfig.getSSLProfile(options.ssl)
        : options.ssl || false;
    this.multipleStatements = options.multipleStatements || false;
    this.rowsAsArray = options.rowsAsArray || false;
    this.namedPlaceholders = options.namedPlaceholders || false;
    this.nestTables =
      options.nestTables === undefined ? undefined : options.nestTables;
    this.typeCast = options.typeCast === undefined ? true : options.typeCast;
    if (this.timezone[0] === ' ') {
      // "+" is a url encoded char for space so it
      // gets translated to space when giving a
      // connection string..
      this.timezone = `+${this.timezone.substr(1)}`;
    }
    if (this.ssl) {
      if (typeof this.ssl !== 'object') {
        throw new TypeError(
          `SSL profile must be an object, instead it's a ${typeof this.ssl}`
        );
      }
      // Default rejectUnauthorized to true
      this.ssl.rejectUnauthorized = this.ssl.rejectUnauthorized !== false;
    }
    this.maxPacketSize = 0;
    this.charsetNumber = options.charset
      ? ConnectionConfig.getCharsetNumber(options.charset)
      : options.charsetNumber || Charsets.UTF8MB4_UNICODE_CI;
    this.compress = options.compress || false;
    this.authSwitchHandler = options.authSwitchHandler;
    this.clientFlags = ConnectionConfig.mergeFlags(
      ConnectionConfig.getDefaultFlags(options),
      options.flags || ''
    );
    this.connectAttributes = options.connectAttributes;
    this.maxPreparedStatements = options.maxPreparedStatements || 16000;
  }

  static mergeFlags(default_flags, user_flags) {
    let flags = 0x0,
      i;
    user_flags = (user_flags || '').toUpperCase().split(/\s*,+\s*/);
    // add default flags unless "blacklisted"
    for (i in default_flags) {
      if (user_flags.indexOf(`-${default_flags[i]}`) >= 0) {
        continue;
      }
      flags |= ClientConstants[default_flags[i]] || 0x0;
    }
    // add user flags unless already already added
    for (i in user_flags) {
      if (user_flags[i][0] === '-') {
        continue;
      }
      if (default_flags.indexOf(user_flags[i]) >= 0) {
        continue;
      }
      flags |= ClientConstants[user_flags[i]] || 0x0;
    }
    return flags;
  }

  static getDefaultFlags(options) {
    const defaultFlags = [
      'LONG_PASSWORD',
      'FOUND_ROWS',
      'LONG_FLAG',
      'CONNECT_WITH_DB',
      'ODBC',
      'LOCAL_FILES',
      'IGNORE_SPACE',
      'PROTOCOL_41',
      'IGNORE_SIGPIPE',
      'TRANSACTIONS',
      'RESERVED',
      'SECURE_CONNECTION',
      'MULTI_RESULTS',
      'TRANSACTIONS',
      'SESSION_TRACK'
    ];
    if (options && options.multipleStatements) {
      defaultFlags.push('MULTI_STATEMENTS');
    }
    if (options && options.authSwitchHandler) {
      defaultFlags.push('PLUGIN_AUTH');
      defaultFlags.push('PLUGIN_AUTH_LENENC_CLIENT_DATA');
    }
    if (options && options.connectAttributes) {
      defaultFlags.push('CONNECT_ATTRS');
    }
    return defaultFlags;
  }

  static getCharsetNumber(charset) {
    const num = Charsets[charset.toUpperCase()];
    if (num === undefined) {
      throw new TypeError(`Unknown charset '${charset}'`);
    }
    return num;
  }

  static getSSLProfile(name) {
    if (!SSLProfiles) {
      SSLProfiles = require('./constants/ssl_profiles.js');
    }
    const ssl = SSLProfiles[name];
    if (ssl === undefined) {
      throw new TypeError(`Unknown SSL profile '${name}'`);
    }
    return ssl;
  }

  static parseUrl(url) {
    url = urlParse(url, true);
    const options = {
      host: url.hostname,
      port: url.port,
      database: url.pathname.substr(1)
    };
    if (url.auth) {
      const auth = url.auth.split(':');
      options.user = auth[0];
      options.password = auth[1];
    }
    if (url.query) {
      for (const key in url.query) {
        const value = url.query[key];
        try {
          // Try to parse this as a JSON expression first
          options[key] = JSON.parse(value);
        } catch (err) {
          // Otherwise assume it is a plain string
          options[key] = value;
        }
      }
    }
    return options;
  }
}

module.exports = ConnectionConfig;
