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

const modelPeekAt = (items: number[], index: number) => {
  if (index !== (index | 0)) return undefined;

  const size = items.length;

  if (index >= size || index < -size) return undefined;

  return index < 0 ? items[index + size] : items[index];
};

const modelRemoveOne = (items: number[], index: number) => {
  if (index !== (index | 0)) return undefined;

  const size = items.length;

  if (index >= size || index < -size) return undefined;
  if (index < 0) index += size;

  return items.splice(index, 1)[0];
};

const modelRemove = (items: number[], index: number, count?: number) => {
  if (index !== (index | 0)) return undefined;
  if (items.length === 0) return undefined;

  const size = items.length;

  if (index >= size || index < -size || (count !== undefined && count < 1))
    return undefined;
  if (index < 0) index += size;
  if (count === 1 || !count) return [modelRemoveOne(items, index)];
  if (count !== (count | 0)) return undefined;
  if (index + count > size) count = size - index;

  return items.splice(index, count);
};

const modelSplice = (
  items: number[],
  index: number,
  count?: number,
  newItems: number[] = []
) => {
  if (index !== (index | 0)) return undefined;

  const size = items.length;

  if (index < 0) index += size;
  if (index > size) return undefined;
  if (newItems.length === 0) return modelRemove(items, index, count);
  if (index < 0) return undefined;

  const removalCount = count === undefined ? 1 : count;

  if (removalCount !== (removalCount | 0) || removalCount < 0) return undefined;

  if (removalCount === 0) {
    items.splice(index, 0, ...newItems);
    return [];
  }

  if (index >= size) {
    items.splice(index, 0, ...newItems);
    return undefined;
  }

  return items.splice(index, removalCount, ...newItems);
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

  it('returns the new length from push and unshift', () => {
    const queue = new RingQueue();

    strict.equal(queue.push('a'), 1);
    strict.equal(queue.push('b'), 2);
    strict.equal(queue.unshift('z'), 3);

    queue.shift();

    strict.equal(queue.push('c'), 3);
  });

  it('treats push and unshift without arguments as a no-op', () => {
    const queue = new RingQueue();

    queue.push('a');

    strict.equal(queue.push(), 1);
    strict.equal(queue.unshift(), 1);
    strict.equal(queue.length, 1);
    strict.deepStrictEqual(queue.toArray(), ['a']);
  });

  it('unshifts to the front across wrap-around', () => {
    const queue = buildWrapped();

    queue.unshift(5);

    strict.deepStrictEqual(queue.toArray(), [5, ...wrappedContent]);
    strict.equal(queue.shift(), 5);
  });

  it('peeks at both ends without removing', () => {
    const queue = buildWrapped();

    strict.equal(queue.peek(), 6);
    strict.equal(queue.peekFront(), 6);
    strict.equal(queue.peekBack(), 12);
    strict.equal(queue.length, wrappedContent.length);

    const empty = new RingQueue();

    strict.equal(empty.peek(), undefined);
    strict.equal(empty.peekFront(), undefined);
    strict.equal(empty.peekBack(), undefined);
  });

  it('reports size and emptiness', () => {
    const queue = new RingQueue();

    strict.equal(queue.size(), 0);
    strict.equal(queue.isEmpty(), true);

    queue.push(1);

    strict.equal(queue.size(), 1);
    strict.equal(queue.isEmpty(), false);
  });

  it('gets items by index, counting from the end on negatives', () => {
    const queue = buildWrapped();

    for (let i = 0; i < wrappedContent.length; i++) {
      strict.equal(queue.get(i), wrappedContent[i]);
      strict.equal(queue.peekAt(i), wrappedContent[i]);
    }

    strict.equal(queue.get(-1), 12);
    strict.equal(queue.peekAt(-7), 6);
    strict.equal(queue.get(queue.length), undefined);
    strict.equal(queue.peekAt(-8), undefined);
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
    strict.equal(queue.removeOne(1.5), undefined);
    strict.equal(queue.length, wrappedContent.length);
  });

  it('removes by negative index without corrupting the queue', () => {
    const queue = buildWrapped();

    strict.equal(queue.removeOne(-1), 12);
    strict.deepStrictEqual(queue.toArray(), [6, 7, 8, 9, 10, 11]);
    strict.equal(queue.removeOne(-6), 6);
    strict.deepStrictEqual(queue.toArray(), [7, 8, 9, 10, 11]);
    strict.equal(queue.removeOne(-6), undefined);
  });

  it('removes ranges with denque-compatible validation and clamping', () => {
    const queue = buildWrapped();

    strict.deepStrictEqual(queue.remove(1, 2), [7, 8]);
    strict.deepStrictEqual(queue.toArray(), [6, 9, 10, 11, 12]);
    strict.deepStrictEqual(queue.remove(3), [11]);
    strict.deepStrictEqual(queue.remove(-2, 5), [10, 12]);
    strict.deepStrictEqual(queue.toArray(), [6, 9]);
    strict.equal(queue.remove(0, 0), undefined);
    strict.equal(queue.remove(5, 1), undefined);
    strict.equal(new RingQueue().remove(0, 1), undefined);
  });

  it('splices like denque, delegating removals and inserting items', () => {
    const queue = buildWrapped();

    strict.deepStrictEqual(queue.splice(-1), [12]);
    strict.deepStrictEqual(queue.splice(1, 2), [7, 8]);
    strict.deepStrictEqual(queue.toArray(), [6, 9, 10, 11]);
    strict.deepStrictEqual(queue.splice(2, 0, 97, 98), []);
    strict.deepStrictEqual(queue.toArray(), [6, 9, 97, 98, 10, 11]);
    strict.deepStrictEqual(queue.splice(1, 1, 55), [9]);
    strict.deepStrictEqual(queue.toArray(), [6, 55, 97, 98, 10, 11]);
    strict.equal(queue.splice(queue.length, 1, 77), undefined);
    strict.deepStrictEqual(queue.toArray(), [6, 55, 97, 98, 10, 11, 77]);
    strict.equal(queue.splice(99, 1), undefined);
  });

  it('clears in place and stays usable', () => {
    const queue = buildWrapped();

    queue.clear();

    strict.equal(queue.length, 0);
    strict.equal(queue.shift(), undefined);
    strict.deepStrictEqual(queue.toArray(), []);

    queue.push('again');

    strict.deepStrictEqual(queue.toArray(), ['again']);
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

      const anyIndex = () => {
        const span = model.length + 4;
        return Math.floor(random() * (2 * span + 1)) - span;
      };

      const anyCount = () => {
        const roll = random();
        if (roll < 0.2) return undefined;
        if (roll < 0.3) return 0;
        return 1 + Math.floor(random() * (model.length + 2));
      };

      for (let op = 0; op < 12000; op++) {
        const roll = random();

        if (roll < 0.2) {
          const burst = roll < 0.005 ? 1 + Math.floor(random() * 1200) : 1;

          for (let i = 0; i < burst; i++) {
            nextValue += 1;
            strict.equal(queue.push(nextValue), model.push(nextValue));
          }
        } else if (roll < 0.26) {
          nextValue += 1;
          strict.equal(queue.unshift(nextValue), model.unshift(nextValue));
        } else if (roll < 0.42) {
          strict.equal(queue.shift(), model.shift());
        } else if (roll < 0.5) {
          strict.equal(queue.pop(), model.pop());
        } else if (roll < 0.58) {
          const index = anyIndex();

          strict.equal(queue.peekAt(index), modelPeekAt(model, index));
          strict.equal(queue.get(index), modelPeekAt(model, index));
        } else if (roll < 0.61) {
          strict.equal(queue.peek(), model[0]);
          strict.equal(queue.peekBack(), modelPeekAt(model, -1));
          strict.equal(queue.size(), model.length);
          strict.equal(queue.isEmpty(), model.length === 0);
        } else if (roll < 0.69) {
          const index = anyIndex();

          strict.equal(queue.removeOne(index), modelRemoveOne(model, index));
        } else if (roll < 0.77) {
          const index = anyIndex();
          const count = anyCount();

          strict.deepStrictEqual(
            queue.remove(index, count),
            modelRemove(model, index, count)
          );
        } else if (roll < 0.85) {
          const index = anyIndex();
          const count = anyCount();

          strict.deepStrictEqual(
            queue.splice(index, count),
            modelSplice(model, index, count)
          );
        } else if (roll < 0.92) {
          const index = anyIndex();
          const count = anyCount();
          const inserts = [nextValue + 1, nextValue + 2].slice(
            0,
            1 + Math.floor(random() * 2)
          );
          nextValue += inserts.length;

          strict.deepStrictEqual(
            queue.splice(index, count, ...inserts),
            modelSplice(model, index, count, inserts)
          );
        } else if (roll < 0.93) {
          queue.clear();
          model.length = 0;
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
