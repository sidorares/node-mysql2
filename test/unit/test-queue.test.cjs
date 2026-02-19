'use strict';

const { assert } = require('poku');
const { Queue } = require('../../lib/compressed_protocol.js');

const q = new Queue();
const order = [];

q.push((task) => {
  order.push(1);
  setTimeout(() => {
    order.push(2);
    task.done();
  }, 10);
});

q.push((task) => {
  order.push(3);
  task.done();
});

q.push((task) => {
  order.push(4);
  task.done();
});

setTimeout(() => {
  assert.deepStrictEqual(order, [1, 2, 3, 4]);

  order.length = 0;
  q.push((task) => {
    order.push(5);
    task.done();
  });

  setTimeout(() => {
    assert.deepStrictEqual(order, [5]);
  }, 10);
}, 50);
