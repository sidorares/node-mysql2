'use strict';

const MIN_SHRINK_TAIL = 10000;

class RingQueue {
  constructor() {
    this._list = new Array(4);
    this._mask = 3;
    this._head = 0;
    this._tail = 0;
  }

  get length() {
    return (this._tail - this._head) & this._mask;
  }

  push(item) {
    this._list[this._tail] = item;
    this._tail = (this._tail + 1) & this._mask;

    if (this._tail === this._head) {
      this._grow();
    }

    return this.length;
  }

  shift() {
    const head = this._head;

    if (head === this._tail) {
      return undefined;
    }

    const item = this._list[head];
    this._list[head] = undefined;
    this._head = (head + 1) & this._mask;

    if (
      head < 2 &&
      this._tail > MIN_SHRINK_TAIL &&
      this._tail <= this._list.length >>> 2
    ) {
      this._shrink();
    }

    return item;
  }

  pop() {
    const tail = this._tail;

    if (tail === this._head) {
      return undefined;
    }

    const capacity = this._list.length;
    this._tail = (tail - 1) & this._mask;

    const item = this._list[this._tail];
    this._list[this._tail] = undefined;

    if (this._head < 2 && tail > MIN_SHRINK_TAIL && tail <= capacity >>> 2) {
      this._shrink();
    }

    return item;
  }

  get(index) {
    if (index !== (index | 0)) {
      return undefined;
    }

    if (index < 0 || index >= this.length) {
      return undefined;
    }

    return this._list[(this._head + index) & this._mask];
  }

  removeOne(index) {
    if (index !== (index | 0)) {
      return undefined;
    }

    const size = this.length;

    if (index < 0 || index >= size) {
      return undefined;
    }

    const mask = this._mask;
    let slot = (this._head + index) & mask;
    const item = this._list[slot];
    const isCloserToHead = index < size / 2;

    if (isCloserToHead) {
      for (let moves = index; moves > 0; moves--) {
        const previous = (slot - 1) & mask;
        this._list[slot] = this._list[previous];
        slot = previous;
      }

      this._list[slot] = undefined;
      this._head = (this._head + 1) & mask;
    } else {
      for (let moves = size - 1 - index; moves > 0; moves--) {
        const next = (slot + 1) & mask;
        this._list[slot] = this._list[next];
        slot = next;
      }

      this._list[slot] = undefined;
      this._tail = (this._tail - 1) & mask;
    }

    return item;
  }

  toArray() {
    const head = this._head;
    const tail = this._tail;

    if (head <= tail) {
      return this._list.slice(head, tail);
    }

    const capacity = this._list.length;
    const items = new Array(this.length);
    let count = 0;

    for (let slot = head; slot < capacity; slot++) {
      items[count++] = this._list[slot];
    }

    for (let slot = 0; slot < tail; slot++) {
      items[count++] = this._list[slot];
    }

    return items;
  }

  _grow() {
    const list = this._list;
    const capacity = list.length;

    if (this._head === 0) {
      this._tail = capacity;
      list.length = capacity << 1;
    } else {
      const grown = new Array(capacity << 1);
      let count = 0;

      for (let slot = this._head; slot < capacity; slot++) {
        grown[count++] = list[slot];
      }

      for (let slot = 0; slot < this._tail; slot++) {
        grown[count++] = list[slot];
      }

      this._list = grown;
      this._head = 0;
      this._tail = capacity;
    }

    this._mask = (this._mask << 1) | 1;
  }

  _shrink() {
    this._list.length >>>= 1;
    this._mask >>>= 1;
  }
}

module.exports = RingQueue;
