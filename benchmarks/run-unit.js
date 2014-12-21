#!/usr/bin/env node

var fs = require('fs');
var nWarmup = 2;
var nRepeats = 32 + nWarmup;

function stats(times) {
  var avg = 0;
  for(var i=0; i < times.length; ++i) {
    avg += times[i]/times.length;
  }
  return {
    avg: avg
  };
}

function runFolder(name, done) {
  fs.readdir(name, function(err, list) {
    if (err)
      return done(err);
    runFileList(name, list, done);
  });
}

function benchmarkModule(m, done) {
  var results = [];
  console.log(m.comment);
  function repeat(w, n) {
    if (n === 0) {
      console.log(stats(results));
      return done();
    }
    var start = process.hrtime();
    setImmediate(function() {
      m(function() {
        var end = process.hrtime(start);
        if (w <= 0)
          results.push(end[0]*1e9 + end[1]);
        repeat(w-1, n-1);
      });
    });
  }
  repeat(nWarmup, nRepeats, done);
}

function runFileList(base, list, done) {
  var index = -1;
  function runOne(err) {
    if (err) return done(err);
    ++index;
    if (index >= list.length)
      return done();
    var fname = base + '/' + list[index];
    fs.stat(fname, function(err, stat) {
      if (err) return done(err);
      if (stat.isDirectory())
        return runFolder(fname, runOne);

      else if (fname.slice(-3) == '.js') {
        var m = require(fname);
        return benchmarkModule(m, runOne);
      }
      runOne();
    });
  }
  runOne();
}

runFolder(__dirname + '/unit', function(err, results) {
});
