import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRAIGHT, ELBOW } from '../src/logic/pieces.js';
import { Grid } from '../src/logic/grid.js';
import { Round } from '../src/logic/round.js';

const row = (n, extra = {}) => {
  const g = new Grid({ width: n, height: 3, sourceRow: 1, drainRow: 1, ...extra });
  return g;
};
const opts = { startDelay: 5, waterSpeed: 2 }; // 0.5 s per tile

test('R-005 countdown runs before water starts, then water flows', () => {
  const g = row(3);
  for (let x = 0; x < 3; x++) g.place(x, 1, STRAIGHT);
  const r = new Round(g, opts);
  r.update(2);
  assert.equal(r.phase, 'countdown');
  assert.equal(r.countdown, 3);
  assert.equal(g.getTile(0, 1).locked, false);
  r.update(3);
  assert.equal(r.phase, 'flowing');
  assert.equal(r.path.length, 1);
  assert.equal(g.getTile(0, 1).locked, true);
});

test('R-005 water fills one tile per 1/speed seconds, at constant speed', () => {
  const g = row(4);
  for (let x = 0; x < 4; x++) g.place(x, 1, STRAIGHT);
  const r = new Round(g, opts);
  r.update(5);              // water starts
  r.update(0.25);
  assert.equal(r.path.length, 1);
  assert.equal(r.progress, 0.5);
  r.update(0.25);           // first tile full, second entered
  assert.equal(r.path.length, 2);
  assert.equal(g.getTile(1, 1).locked, true);
  assert.equal(g.getTile(2, 1).locked, false);
  r.update(0.5);
  assert.equal(r.path.length, 3);
});

test('R-005 time left over after the countdown carries into filling', () => {
  const g = row(3);
  for (let x = 0; x < 3; x++) g.place(x, 1, STRAIGHT);
  const r = new Round(g, opts);
  r.update(5.75);          // 0.75 s of water: one full tile plus half of the next
  assert.equal(r.path.length, 2);
  assert.equal(r.progress, 0.5);
});

test('R-006 a connected route wins, even when time jumps ahead', () => {
  const g = row(3);
  for (let x = 0; x < 3; x++) g.place(x, 1, STRAIGHT);
  const r = new Round(g, opts);
  r.update(100);
  assert.equal(r.phase, 'won');
  assert.equal(r.over, true);
});

test('R-006 a gap spills and reports where', () => {
  const g = row(3);
  g.place(0, 1, STRAIGHT);
  const r = new Round(g, opts);
  r.update(100);
  assert.equal(r.phase, 'lost');
  assert.equal(r.reason, 'gap');
  assert.deepEqual(r.spillAt, { x: 1, y: 1 });
});

test('R-006 an empty first cell spills the moment the water starts', () => {
  const r = new Round(row(3), opts);
  r.update(5);
  assert.equal(r.phase, 'lost');
  assert.equal(r.reason, 'gap');
});

test('R-006 the player can place and rotate until the water reaches a tile', () => {
  const g = row(3);
  g.place(0, 1, STRAIGHT);
  const r = new Round(g, opts);
  r.update(5.2);                          // water in tile 0, tile 1 still empty
  assert.equal(g.rotateTile(0, 1).reason, 'locked');
  assert.equal(g.place(1, 1, STRAIGHT).ok, true);   // placed in time
  g.place(2, 1, STRAIGHT);
  r.update(100);
  assert.equal(r.phase, 'won');
});

test('R-006 a bent route wins and the state stops changing once over', () => {
  const g = new Grid({ width: 3, height: 3, sourceRow: 0, drainRow: 2 });
  g.place(0, 0, STRAIGHT);
  g.place(1, 0, ELBOW); g.rotateTile(1, 0); g.rotateTile(1, 0); // S+W
  g.place(1, 1, STRAIGHT); g.rotateTile(1, 1);                  // N+S
  g.place(1, 2, ELBOW);                                          // N+E
  g.place(2, 2, STRAIGHT);
  const r = new Round(g, opts);
  r.update(100);
  assert.equal(r.phase, 'won');
  const n = r.path.length;
  r.update(50);
  assert.equal(r.path.length, n);
});
