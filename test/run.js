#!/usr/bin/env node

var options = {
  verbose: true
};

if (process.env.FILTER) {
  options.include = new RegExp(process.env.FILTER + '.*\\.js$');
}

// set timezone to UTC
process.env.TZ = 'UTC';

require('urun')(__dirname, options);

process.on('exit', function(code) {
  console.log('About to exit with code: ' + code);
});

process.on('unhandledRejection', function(reason) {
  console.log('unhandledRejection', reason);
});

process.on('uncaughtException', function(err) {
  console.log('uncaughtException', err);
});
