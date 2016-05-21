#!/usr/bin/env node

var options = {
  verbose: true
};

if (process.env.FILTER) {
  options.include = new RegExp(process.env.FILTER + '.*\\.js$');
}
require('urun')(__dirname, options);
