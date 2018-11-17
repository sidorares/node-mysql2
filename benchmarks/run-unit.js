#!/usr/bin/env node

'use strict';

const progress = require('progress');

const fs = require('fs');
const nWarmup = 2;
const nRepeats = 32 + nWarmup;
const path = require('path');

const prevResults = {};
try {
  const r = require('./results.json');
  r.forEach(rr => {
    prevResults[rr.path] = rr;
  });
} catch (e) {
  // no prev results?
}

function stats(times) {
  let avg = 0;
  for (let i = 0; i < times.length; ++i) {
    avg += times[i] / times.length;
  }
  let v = 0;
  for (let i = 0; i < times.length; ++i) {
    v += ((times[i] - avg) * (times[i] - avg)) / times.length;
  }
  const stdev = Math.sqrt(v);
  return {
    avg: avg,
    stdev: stdev,
    stdevrel: stdev / avg
  };
}

function runFolder(name, done) {
  fs.readdir(name, (err, list) => {
    if (err) return done(err);
    // eslint-disable-next-line no-use-before-define
    runFileList(name, list, done);
  });
}

function benchmarkModule(m, modulePath, done) {
  const results = [];
  const bar = new progress(m.comment + ' [:bar] ', {
    total: nRepeats,
    clear: true
  });
  function repeat(w, n) {
    bar.tick();
    if (n === 0) {
      const result = {};
      const s = stats(results);
      const unsDigits = Math.floor(Math.floor(s.stdev).toString().length * 0.8);
      let pow = Math.pow(10, unsDigits);
      const avg = Math.round(s.avg / pow) * pow;
      const uns = Math.round(s.stdev / pow) * pow;
      console.log('%s: %s  ±%s', m.comment, avg, uns);
      result.time = s.avg;
      result.timeStdev = s.stdev;
      result.comment = m.comment;
      result.path = path.relative(__dirname, modulePath);
      if (m.toSpeed) {
        const speed = m.toSpeed(s.avg, s.stdev);
        const speedDigits = Math.floor(
          Math.floor(speed.error).toString().length * 0.8
        );
        pow = Math.pow(10, speedDigits);
        console.log(
          '           = %s ±%s %s',
          Math.round(speed.value / pow) * pow,
          Math.round(speed.error / pow) * pow,
          speed.units
        );
        const prev = prevResults[result.path];
        if (prev) {
          if (speed.value > prev.speed.value + prev.speed.error) {
            console.log(
              'Faster then prev result: %s ±%s %s',
              prev.speed.value,
              prev.speed.units
            );
          } else if (speed.value < prev.speed.value - prev.speed.error) {
            console.log(
              'Slower then prev result: %s ±%s %s',
              prev.speed.value,
              prev.speed.units
            );
          }
        }
        result.speed = speed;
      }
      return done(null, result);
    }
    const start = process.hrtime();
    setImmediate(() => {
      m(() => {
        const end = process.hrtime(start);
        if (w <= 0) results.push(end[0] * 1e9 + end[1]);
        repeat(w - 1, n - 1);
      });
    });
  }
  repeat(nWarmup - 1, nRepeats - 1, done);
}

function runFileList(base, list, done) {
  let index = -1;
  let results;
  function runOne(err, res) {
    if (err) return done(err);
    ++index;
    if (res) {
      if (!results) results = [];
      if (Array.isArray(res)) results = results.concat(res);
      else results.push(res);
    }
    if (index >= list.length) {
      return done(null, results);
    }
    const fname = base + '/' + list[index];
    fs.stat(fname, (err, stat) => {
      if (err) return done(err);
      if (stat.isDirectory()) return runFolder(fname, runOne);
      else if (fname.slice(-3) == '.js') {
        const m = require(fname);
        return benchmarkModule(m, fname, runOne);
      }
      runOne();
    });
  }
  runOne();
}

//const name = process.argv[2] || __dirname + '/unit';
runFolder(__dirname + '/unit', (err, results) => {
  //console.log(results);
  fs.writeFileSync(__dirname + '/results.json', JSON.stringify(results));
});
