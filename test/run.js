#!/usr/bin/env node

'use strict';

const options = {
  verbose: true
};

if (process.env.FILTER) {
  options.include = new RegExp(`${process.env.FILTER}.*\\.js$`);
}

// set timezone to UTC
process.env.TZ = 'UTC';

require('urun')(__dirname, options);

process.on('exit', code => {
  console.log(`About to exit with code: ${code}`);
});

process.on('unhandledRejection', reason => {
  console.log('unhandledRejection', reason);
});

process.on('uncaughtException', err => {
  console.log('uncaughtException', err);
});
