var urlParse = require('url').parse;
var ClientConstants = require('./constants/client');
var Charsets = require('./constants/charsets');
var SSLProfiles = null;

module.exports = ConnectionConfig;
function ConnectionConfig (options) {
  if (typeof options === 'string') {
    options = ConnectionConfig.parseUrl(options);
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
  this.connectTimeout = (options.connectTimeout === undefined)
    ? (10 * 1000)
    : options.connectTimeout;
  this.insecureAuth = options.insecureAuth || false;
  this.supportBigNumbers = options.supportBigNumbers || false;
  this.bigNumberStrings = options.bigNumberStrings || false;
  this.decimalNumbers = options.decimalNumbers || false;
  this.dateStrings = options.dateStrings || false;
  this.debug = options.debug;
  this.trace = options.trace !== false;
  this.stringifyObjects = options.stringifyObjects || false;
  this.timezone = options.timezone || 'local';
  this.queryFormat = options.queryFormat;
  this.pool = options.pool || undefined;
  this.ssl = (typeof options.ssl === 'string')
    ? ConnectionConfig.getSSLProfile(options.ssl)
    : (options.ssl || false);
  this.multipleStatements = options.multipleStatements || false;
  this.rowsAsArray = options.rowsAsArray || false;
  this.namedPlaceholders = options.namedPlaceholders || false;
  this.nestTables = (options.nestTables === undefined) ? undefined : options.nestTables;
  this.typeCast = (options.typeCast === undefined)
    ? true
    : options.typeCast;

  if (this.timezone[0] == ' ') {
    // "+" is a url encoded char for space so it
    // gets translated to space when giving a
    // connection string..
    this.timezone = '+' + this.timezone.substr(1);
  }

  if (this.ssl) {
    // Default rejectUnauthorized to true
    this.ssl.rejectUnauthorized = this.ssl.rejectUnauthorized !== false;
  }

  this.maxPacketSize = 0;
  this.charsetNumber = (options.charset)
    ? ConnectionConfig.getCharsetNumber(options.charset)
    : options.charsetNumber || Charsets.UTF8MB4_UNICODE_CI;

  this.compress = options.compress || false;

  this.authSwitchHandler = options.authSwitchHandler;

  this.clientFlags = ConnectionConfig.mergeFlags(ConnectionConfig.getDefaultFlags(options),
                                                 options.flags || '');

  this.connectAttributes = options.connectAttributes;
  this.maxPreparedStatements = options.maxPreparedStatements || 16000;
}

ConnectionConfig.mergeFlags = function (default_flags, user_flags) {
  var flags = 0x0, i;

  user_flags = (user_flags || '').toUpperCase().split(/\s*,+\s*/);

  // add default flags unless "blacklisted"
  for (i in default_flags) {
    if (user_flags.indexOf('-' + default_flags[i]) >= 0) {
      continue;
    }

    flags |= ClientConstants[default_flags[i]] || 0x0;
  }
  // add user flags unless already already added
  for (i in user_flags) {
    if (user_flags[i][0] == '-') {
      continue;
    }

    if (default_flags.indexOf(user_flags[i]) >= 0) {
      continue;
    }

    flags |= ClientConstants[user_flags[i]] || 0x0;
  }

  return flags;
};

ConnectionConfig.getDefaultFlags = function (options) {
  var defaultFlags = ['LONG_PASSWORD', 'FOUND_ROWS', 'LONG_FLAG',
    'CONNECT_WITH_DB', 'ODBC', 'LOCAL_FILES',
    'IGNORE_SPACE', 'PROTOCOL_41', 'IGNORE_SIGPIPE',
    'TRANSACTIONS', 'RESERVED', 'SECURE_CONNECTION',
    'MULTI_RESULTS', 'TRANSACTIONS', 'SESSION_TRACK'];

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
};

ConnectionConfig.getCharsetNumber = function getCharsetNumber (charset) {
  var num = Charsets[charset.toUpperCase()];

  if (num === undefined) {
    throw new TypeError('Unknown charset \'' + charset + '\'');
  }

  return num;
};

ConnectionConfig.getSSLProfile = function getSSLProfile (name) {
  if (!SSLProfiles) {
    SSLProfiles = require('./constants/ssl_profiles.js');
  }

  var ssl = SSLProfiles[name];

  if (ssl === undefined) {
    throw new TypeError('Unknown SSL profile \'' + name + '\'');
  }

  return ssl;
};

ConnectionConfig.parseUrl = function (url) {
  url = urlParse(url, true);

  var options = {
    host     : url.hostname,
    port     : url.port,
    database : url.pathname.substr(1)
  };

  if (url.auth) {
    var auth = url.auth.split(':');
    options.user = auth[0];
    options.password = auth[1];
  }

  if (url.query) {
    for (var key in url.query) {
      var value = url.query[key];

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
};
