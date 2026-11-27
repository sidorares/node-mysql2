import { describe, it, strict } from 'poku';
import createStatementCache from '../../../lib/statement_cache.js';

type FakeStatement = { id: number; close: () => void };

const fill = (limit: number, count: number) => {
  const closed: number[] = [];
  const cache = createStatementCache(limit);
  const capacities: number[] = [];

  for (let id = 0; id < count; id++) {
    const statement: FakeStatement = { id, close: () => closed.push(id) };
    cache.set(`SELECT ${id}`, statement);
    capacities.push(cache.max);
  }

  return { cache, closed, capacities };
};

describe('Statement cache: grows on demand up to maxPreparedStatements', () => {
  it('allocates a small cache regardless of the limit', () => {
    strict.equal(createStatementCache(16000).max, 16);
    strict.equal(createStatementCache(4).max, 4);
  });

  it('doubles its capacity only when full, capped at the limit', () => {
    const { cache, closed, capacities } = fill(40, 40);

    strict.equal(capacities[15], 16);
    strict.equal(capacities[16], 32);
    strict.equal(capacities[31], 32);
    strict.equal(capacities[32], 40);
    strict.equal(cache.max, 40);
    strict.equal(cache.size, 40);
    strict.deepEqual(closed, []);
  });

  it('closes the least recently used statement once the limit is reached', () => {
    const { cache, closed } = fill(40, 40);

    cache.get('SELECT 0');
    cache.set('SELECT 40', { id: 40, close: () => closed.push(40) });

    strict.equal(cache.max, 40);
    strict.equal(cache.size, 40);
    strict.deepEqual(closed, [1]);
    strict.equal(cache.has('SELECT 0'), true);
    strict.equal(cache.has('SELECT 1'), false);
  });

  it('keeps every statement reachable across growth', () => {
    const { cache } = fill(16000, 100);

    strict.equal(cache.max, 128);
    for (let id = 0; id < 100; id++) {
      strict.equal(cache.get(`SELECT ${id}`)?.id, id);
    }
  });

  it('closes every statement on clear', () => {
    const { cache, closed } = fill(16000, 20);

    cache.clear();

    strict.equal(cache.size, 0);
    strict.deepEqual(
      closed.sort((a, b) => a - b),
      Array.from({ length: 20 }, (_, id) => id)
    );
  });
});
