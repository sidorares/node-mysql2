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
