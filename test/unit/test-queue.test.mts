import { assert, describe, it } from 'poku';
import compressedProtocol from '../../lib/compressed_protocol.js';

const { Queue } = compressedProtocol;

await describe('Queue', async () => {
  await it('should execute tasks sequentially', async () => {
    const q = new Queue();
    const order: number[] = [];

    await new Promise<void>((resolve) => {
      q.push((task: { done: () => void }) => {
        order.push(1);
        setTimeout(() => {
          order.push(2);
          task.done();
        }, 10);
      });

      q.push((task: { done: () => void }) => {
        order.push(3);
        task.done();
      });

      q.push((task: { done: () => void }) => {
        order.push(4);
        task.done();
        resolve();
      });
    });

    assert.deepStrictEqual(order, [1, 2, 3, 4]);
  });

  await it('should accept new tasks after draining', async () => {
    const q = new Queue();
    const order: number[] = [];

    await new Promise<void>((resolve) => {
      q.push((task: { done: () => void }) => {
        order.push(1);
        task.done();
      });

      q.push((task: { done: () => void }) => {
        order.push(2);
        task.done();
        resolve();
      });
    });

    assert.deepStrictEqual(order, [1, 2]);

    await new Promise<void>((resolve) => {
      q.push((task: { done: () => void }) => {
        order.push(3);
        task.done();
        resolve();
      });
    });

    assert.deepStrictEqual(order, [1, 2, 3]);
  });
});
