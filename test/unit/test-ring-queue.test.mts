import { describe, it, strict } from 'poku';
import RingQueue from '../../lib/ring_queue.js';

const wrappedContent = [6, 7, 8, 9, 10, 11, 12];

const buildWrapped = () => {
  const queue = new RingQueue();

  for (let i = 1; i <= 6; i++) {
    queue.push(i);
  }

  for (let i = 1; i <= 5; i++) {
    queue.shift();
  }

  for (let i = 7; i <= 12; i++) {
    queue.push(i);
  }

  return queue;
};

const mulberry32 = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

describe('RingQueue', () => {
  it('shifts in FIFO order and returns undefined when empty', () => {
    const queue = new RingQueue();

    queue.push('a');
    queue.push('b');
    queue.push('c');

    strict.equal(queue.shift(), 'a');
    strict.equal(queue.shift(), 'b');
    strict.equal(queue.shift(), 'c');
    strict.equal(queue.shift(), undefined);
    strict.equal(queue.length, 0);
  });

  it('pops in LIFO order and returns undefined when empty', () => {
    const queue = new RingQueue();

    queue.push('a');
    queue.push('b');
    queue.push('c');

    strict.equal(queue.pop(), 'c');
    strict.equal(queue.pop(), 'b');
    strict.equal(queue.pop(), 'a');
    strict.equal(queue.pop(), undefined);
    strict.equal(queue.length, 0);
  });

  it('returns the new length from push', () => {
    const queue = new RingQueue();

    strict.equal(queue.push('a'), 1);
    strict.equal(queue.push('b'), 2);

    queue.shift();

    strict.equal(queue.push('c'), 2);
  });

  it('gets items by index and rejects invalid indexes', () => {
    const queue = buildWrapped();

    for (let i = 0; i < wrappedContent.length; i++) {
      strict.equal(queue.get(i), wrappedContent[i]);
    }

    strict.equal(queue.get(queue.length), undefined);
    strict.equal(queue.get(-1), undefined);
    strict.equal(queue.get(1.5), undefined);
    strict.equal(queue.get(Number.NaN), undefined);
    strict.equal(queue.get(2 ** 31), undefined);
  });

  it('keeps order across wrap-around and both grow paths', () => {
    const wrapped = new RingQueue();

    for (let i = 1; i <= 3; i++) {
      wrapped.push(i);
    }

    wrapped.shift();
    wrapped.shift();
    wrapped.push(4);
    wrapped.push(5);

    strict.deepStrictEqual(wrapped.toArray(), [3, 4, 5]);

    wrapped.push(6);

    strict.deepStrictEqual(wrapped.toArray(), [3, 4, 5, 6]);

    const contiguous = new RingQueue();

    for (let i = 1; i <= 100; i++) {
      contiguous.push(i);
    }

    for (let i = 1; i <= 100; i++) {
      strict.equal(contiguous.shift(), i);
    }

    strict.equal(contiguous.shift(), undefined);
  });

  it('removes one item at any index preserving the order of the rest', () => {
    for (let index = 0; index < wrappedContent.length; index++) {
      const queue = buildWrapped();
      const expected = [...wrappedContent];
      const [removed] = expected.splice(index, 1);

      strict.equal(queue.removeOne(index), removed);
      strict.deepStrictEqual(queue.toArray(), expected);
      strict.equal(queue.length, expected.length);
    }

    const queue = buildWrapped();

    strict.equal(queue.removeOne(queue.length), undefined);
    strict.equal(queue.removeOne(-1), undefined);
    strict.equal(queue.removeOne(1.5), undefined);
    strict.equal(queue.length, wrappedContent.length);
  });

  it('converts to array in empty, contiguous and wrapped states', () => {
    const queue = new RingQueue();

    strict.deepStrictEqual(queue.toArray(), []);

    queue.push(1);
    queue.push(2);

    strict.deepStrictEqual(queue.toArray(), [1, 2]);
    strict.deepStrictEqual(buildWrapped().toArray(), wrappedContent);
  });

  it('clears the slots of shifted and popped items', () => {
    const queue = new RingQueue();

    for (let i = 0; i < 8; i++) {
      queue.push({ id: i });
    }

    queue.shift();
    queue.shift();
    queue.pop();

    const slots: unknown[] = queue._list;
    const liveSlots = slots.filter((slot) => slot !== undefined);

    strict.equal(liveSlots.length, queue.length);
  });

  it('shrinks the backing array on a pop drain', () => {
    const queue = new RingQueue();
    let nextPushValue = 0;

    while (nextPushValue < 32768) {
      queue.push(nextPushValue);
      nextPushValue += 1;
    }

    strict.equal(queue._list.length, 65536);

    while (nextPushValue > 12000) {
      nextPushValue -= 1;
      strict.equal(queue.pop(), nextPushValue);
    }

    strict.equal(queue._list.length, 32768);

    let nextExpectedShift = 0;

    while (nextExpectedShift < 12000) {
      strict.equal(queue.shift(), nextExpectedShift);
      nextExpectedShift += 1;
    }

    strict.equal(queue.length, 0);
  });

  it('shrinks the backing array on a wrapped shift drain', () => {
    const queue = new RingQueue();
    let nextExpectedShift = 0;
    let nextPushValue = 0;

    const push = () => {
      queue.push(nextPushValue);
      nextPushValue += 1;
    };

    const shift = () => {
      strict.equal(queue.shift(), nextExpectedShift);
      nextExpectedShift += 1;
    };

    const pop = () => {
      nextPushValue -= 1;
      strict.equal(queue.pop(), nextPushValue);
    };

    for (let i = 0; i < 32768; i++) {
      push();
    }

    for (let i = 0; i < 65530; i++) {
      shift();
      push();
    }

    for (let i = 0; i < 16378; i++) {
      pop();
    }

    strict.equal(queue._list.length, 65536);

    for (let i = 0; i < 7; i++) {
      shift();
    }

    strict.equal(queue._list.length, 32768);

    while (nextPushValue > nextExpectedShift) {
      shift();
    }

    strict.equal(queue.shift(), undefined);
  });

  it('matches an array model under randomized operations', () => {
    for (const seed of [7, 1337, 202608]) {
      const random = mulberry32(seed);
      const queue = new RingQueue();
      const model: number[] = [];
      let nextValue = 0;

      for (let op = 0; op < 12000; op++) {
        const roll = random();

        if (roll < 0.4) {
          const burst = roll < 0.005 ? 1 + Math.floor(random() * 1200) : 1;

          for (let i = 0; i < burst; i++) {
            nextValue += 1;
            strict.equal(queue.push(nextValue), model.push(nextValue));
          }
        } else if (roll < 0.7) {
          strict.equal(queue.shift(), model.shift());
        } else if (roll < 0.8) {
          strict.equal(queue.pop(), model.pop());
        } else if (roll < 0.9) {
          const index = Math.floor(random() * (model.length + 3)) - 1;

          strict.equal(queue.get(index), model[index]);
        } else if (roll < 0.97) {
          const index = Math.floor(random() * (model.length + 3)) - 1;

          if (index >= 0 && index < model.length) {
            strict.equal(queue.removeOne(index), model.splice(index, 1)[0]);
          } else {
            strict.equal(queue.removeOne(index), undefined);
          }
        } else {
          strict.deepStrictEqual(queue.toArray(), model);
        }

        strict.equal(queue.length, model.length);

        if (op % 2000 === 0) {
          strict.deepStrictEqual(queue.toArray(), model);
        }
      }

      while (model.length > 0) {
        strict.equal(queue.shift(), model.shift());
      }

      strict.equal(queue.shift(), undefined);
    }
  });
});
