import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Progress, PROGRESS_KEY, browserStorage } from '../src/logic/progress.js';

const memory = (initial) => {
  const data = new Map(initial === undefined ? [] : [[PROGRESS_KEY, initial]]);
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data };
};

test('R-007 on first load only level 1 is unlocked', () => {
  const p = new Progress(memory());
  assert.equal(p.isUnlocked(1), true);
  for (let n = 2; n <= 5; n++) assert.equal(p.isUnlocked(n), false);
});

test('R-007 winning level N unlocks level N+1', () => {
  const p = new Progress(memory());
  p.unlockNext(1);
  assert.equal(p.isUnlocked(2), true);
  assert.equal(p.isUnlocked(3), false);
});

test('R-007 unlocked levels survive a reload', () => {
  const store = memory();
  const first = new Progress(store);
  first.unlockNext(1); first.unlockNext(2);
  const reloaded = new Progress(store);
  assert.equal(reloaded.unlocked, 3);
  assert.equal(reloaded.isUnlocked(3), true);
});

test('R-007 replaying an unlocked level keeps progress, and the last level has no next', () => {
  const p = new Progress(memory());
  p.unlockNext(1); p.unlockNext(2);
  p.unlockNext(1);                 // replay and win level 1 again
  assert.equal(p.unlocked, 3);
  p.unlockNext(5); p.unlockNext(4);
  assert.equal(p.unlocked, 5);
  assert.equal(p.isUnlocked(6), false);
  for (let n = 1; n <= 5; n++) assert.equal(p.isUnlocked(n), true); // all replayable
});

test('R-007 invalid saved data gives level 1 only, no crash', () => {
  for (const junk of ['not json', '{', 'null', '[]', '"3"', '{}', '{"unlocked":"3"}',
    '{"unlocked":0}', '{"unlocked":-2}', '{"unlocked":2.5}', '{"unlocked":99}', '{"unlocked":null}']) {
    const p = new Progress(memory(junk));
    assert.equal(p.unlocked, 1, junk);
    assert.equal(p.isUnlocked(2), false, junk);
  }
});

test('R-007 unavailable or throwing storage still works for the session', () => {
  const noStorage = new Progress(null);
  assert.equal(noStorage.unlocked, 1);
  noStorage.unlockNext(1);
  assert.equal(noStorage.isUnlocked(2), true); // kept in memory this session

  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const p = new Progress(throwing);
  assert.equal(p.unlocked, 1);
  assert.doesNotThrow(() => p.unlockNext(1));
  assert.equal(p.isUnlocked(2), true);
});

test('R-007 non-integer level numbers are never unlocked', () => {
  const p = new Progress(memory());
  for (const bad of [0, -1, 1.5, NaN, '1', undefined, null]) assert.equal(p.isUnlocked(bad), false);
});

test('browserStorage returns null outside a browser instead of throwing', () => {
  assert.doesNotThrow(() => browserStorage());
});
