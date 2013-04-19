#!/usr/bin/env node

var options = {};

if (process.env.FILTER) {
    options.include = new RegExp(process.env.FILTER + '.*\\.js$');
}

require('../benchmarks/bench-insert-select.js')(function() {
  require('urun')(__dirname, options);
});
