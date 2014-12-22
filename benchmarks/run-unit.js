#!/usr/bin/env node
var progress = require('progress');

var fs = require('fs');
var nWarmup = 2;
var nRepeats = 32 + nWarmup;
var path = require('path');

var prevResults = {};
try {
  var r = require('./results.json');
  r.forEach(function(rr) {
    prevResults[rr.path] = rr
  });
} catch(e) {
  // no prev results?
}

function stats(times) {
  var avg = 0;
  for(var i=0; i < times.length; ++i) {
    avg += times[i]/times.length;
  }
  var v = 0;
  for(var i=0; i < times.length; ++i) {
    v += (times[i] - avg)*(times[i] - avg) / times.length;
  }
  var stdev = Math.sqrt(v);
  return {
    avg: avg,
    stdev: stdev,
    stdevrel: stdev/avg
  };
}

function runFolder(name, done) {
  fs.readdir(name, function(err, list) {
    if (err)
      return done(err);
    runFileList(name, list, done);
  });
}

function benchmarkModule(m, modulePath, done) {

  var results = [];
   var bar = new progress(m.comment + ' [:bar] ', {
     total: nRepeats,
     clear: true
   });
  function repeat(w, n) {
    bar.tick();
    if (n === 0) {
      var result = {};
      var s = stats(results);
      var unsDigits = Math.floor(Math.floor(s.stdev).toString().length * 0.8);
      var pow = Math.pow(10, unsDigits);
      var avg = Math.round(s.avg / pow)*pow;
      var uns = Math.round(s.stdev / pow)*pow;
      console.log('%s: %s  ±%s', m.comment, avg, uns);
      result.time = s.avg;
      result.timeStdev = s.stdev;
      result.comment = m.comment;
      result.path = path.relative(__dirname, modulePath);
      if (m.toSpeed) {
        var speed = m.toSpeed(s.avg, s.stdev);
        var speedDigits =  Math.floor(Math.floor(speed.error).toString().length * 0.8);
        pow = Math.pow(10, speedDigits);
        console.log('           = %s ±%s %s',
          Math.round(speed.value / pow)*pow,
          Math.round(speed.error / pow)*pow, speed.units);
        var prev = prevResults[result.path];
        if (prev) {
          if (speed.value > prev.speed.value + prev.speed.error) {
            console.log('Faster then prev result: %s ±%s %s', prev.speed.value, prev.speed.units)
          } else if (speed.value < prev.speed.value - prev.speed.error) {
            console.log('Slower then prev result: %s ±%s %s', prev.speed.value, prev.speed.units)
          }
        }
        result.speed = speed;
      }
      return done(null, result);
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
  repeat(nWarmup-1, nRepeats-1, done);
}

function runFileList(base, list, done) {
  var index = -1;
  var results;
  function runOne(err, res) {
    if (err) return done(err);
    ++index;
    if (res) {
      if (!results)
        results = [];
      if (Array.isArray(res))
        results = results.concat(res);
      else
        results.push(res);
    }
    if (index >= list.length) {
      return done(null, results);
    }
    var fname = base + '/' + list[index];
    fs.stat(fname, function(err, stat) {
      if (err) return done(err);
      if (stat.isDirectory())
        return runFolder(fname, runOne);

      else if (fname.slice(-3) == '.js') {
        var m = require(fname);
        return benchmarkModule(m, fname, runOne);
      }
      runOne();
    });
  }
  runOne();
}

//var name = process.argv[2] || __dirname + '/unit';
runFolder(__dirname + '/unit', function(err, results) {
  //console.log(results);
  fs.writeFileSync(__dirname + '/results.json', JSON.stringify(results));
});
