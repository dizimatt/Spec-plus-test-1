import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore } from '../src/logic/score.js';
import { Grid } from '../src/logic/grid.js';
import { Round } from '../src/logic/round.js';
import { Progress, PROGRESS_KEY } from '../src/logic/progress.js';
import { STRAIGHT } from '../src/logic/pieces.js';

const memory = (initial) => {
  const data = new Map(initial === undefined ? [] : [[PROGRESS_KEY, initial]]);
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data };
};

test('R-011 score = max(0, 1000 - 50 * tiles) with the spec examples', () => {
  assert.equal(computeScore(0), 1000);
  assert.equal(computeScore(10), 500);
  assert.equal(computeScore(20), 0);
  assert.equal(computeScore(25), 0);
});

test('R-011 placing more pieces never increases the score', () => {
  for (let n = 0; n < 60; n++) assert.ok(computeScore(n + 1) <= computeScore(n), `n=${n}`);
});

test('R-011 odd input gives a safe score, no crash', () => {
  for (const bad of [NaN, Infinity, undefined, null, '7']) assert.equal(computeScore(bad), 0);
  assert.equal(computeScore(-3), 1000);
});

test('R-011 tilesPlaced counts every placement, not rotations or refused clicks', () => {
  const g = new Grid({ width: 4, height: 3, sourceRow: 1, drainRow: 1, blocked: [[3, 0]] });
  assert.equal(g.tilesPlaced, 0);
  g.place(0, 1, STRAIGHT); g.place(1, 1, STRAIGHT);
  g.rotateTile(0, 1); g.rotateTile(0, 1);
  g.place(1, 1, STRAIGHT);   // occupied
  g.place(3, 0, STRAIGHT);   // blocked
  g.place(9, 9, STRAIGHT);   // out of bounds
  assert.equal(g.tilesPlaced, 2);
});

test('R-011 a winning attempt is scored from every tile placed, including off-route ones', () => {
  const g = new Grid({ width: 3, height: 3, sourceRow: 1, drainRow: 1 });
  for (let x = 0; x < 3; x++) g.place(x, 1, STRAIGHT);
  g.place(0, 0, STRAIGHT); g.place(2, 2, STRAIGHT); // off the route
  const r = new Round(g, { startDelay: 1, waterSpeed: 5 });
  r.update(100);
  assert.equal(r.phase, 'won');
  assert.equal(computeScore(g.tilesPlaced), 1000 - 50 * 5);
});

test('R-011 best score is saved, survives a reload, and a lower score does not overwrite it', () => {
  const store = memory();
  const p = new Progress(store);
  assert.equal(p.bestScore(1), null);
  assert.equal(p.recordScore(1, 500), true);
  assert.equal(p.bestScore(1), 500);
  assert.equal(p.recordScore(1, 300), false);
  assert.equal(p.recordScore(1, 500), false);
  assert.equal(p.bestScore(1), 500);
  assert.equal(p.recordScore(1, 650), true);
  const reloaded = new Progress(store);
  assert.equal(reloaded.bestScore(1), 650);
  assert.equal(reloaded.bestScore(2), null);
});

test('R-011 a score of 0 is a real score, distinct from no score', () => {
  const p = new Progress(memory());
  assert.equal(p.bestScore(2), null);
  assert.equal(p.recordScore(2, 0), true);
  assert.equal(p.bestScore(2), 0);
  assert.equal(p.recordScore(2, 0), false);
});

test('R-011 best scores and unlocks are saved together and do not disturb each other', () => {
  const store = memory();
  const p = new Progress(store);
  p.unlockNext(1); p.recordScore(1, 700); p.unlockNext(2);
  const again = new Progress(store);
  assert.equal(again.unlocked, 3);
  assert.equal(again.bestScore(1), 700);
});

test('R-011 invalid or missing saved scores count as no score, with no crash', () => {
  for (const junk of ['{"unlocked":2,"best":"x"}', '{"unlocked":2,"best":[1,2]}', '{"unlocked":2,"best":null}',
    '{"unlocked":2,"best":{"1":"abc"}}', '{"unlocked":2,"best":{"1":-5}}', '{"unlocked":2,"best":{"1":1001}}',
    '{"unlocked":2,"best":{"1":2.5}}', '{"unlocked":2,"best":{"1":null}}', '{"unlocked":2}', 'not json']) {
    const p = new Progress(memory(junk));
    assert.equal(p.bestScore(1), null, junk);
  }
  // One bad score must not throw away good ones or the unlocks.
  const p = new Progress(memory('{"unlocked":3,"best":{"1":400,"2":"bad","9":300}}'));
  assert.equal(p.bestScore(1), 400);
  assert.equal(p.bestScore(2), null);
  assert.equal(p.bestScore(9), null);
  assert.equal(p.unlocked, 3);
  // And a good score survives a bad unlock value.
  assert.equal(new Progress(memory('{"unlocked":"x","best":{"1":400}}')).bestScore(1), 400);
});

test('R-011 recording invalid scores or levels is ignored', () => {
  const p = new Progress(memory());
  for (const bad of [NaN, -1, 1001, 2.5, '500', null, undefined]) assert.equal(p.recordScore(1, bad), false);
  assert.equal(p.recordScore(0, 500), false);
  assert.equal(p.recordScore(6, 500), false);
  assert.equal(p.bestScore(1), null);
});

test('R-011 throwing or missing storage keeps scores for the session without crashing', () => {
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  for (const store of [throwing, null]) {
    const p = new Progress(store);
    assert.doesNotThrow(() => p.recordScore(1, 500));
    assert.equal(p.bestScore(1), 500);
  }
});

test('R-007 old saves with only unlocks still load', () => {
  const p = new Progress(memory('{"unlocked":4}'));
  assert.equal(p.unlocked, 4);
  assert.equal(p.bestScore(1), null);
});
