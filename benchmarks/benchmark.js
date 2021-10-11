'use strict';

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite;

function addFile(name) {
  const benchmarks = require(name);
  benchmarks.forEach(b => {
    suite.add(b.name, b.fn); 
  })
}

addFile('./unit/packets/column_definition.js');

suite.on('start', async () => {
}).on('complete', () => {
}).on('cycle', event => {
  console.log(String(event.target));
}).run();