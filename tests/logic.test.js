import { test } from 'node:test';
import assert from 'node:assert/strict';
import { N, E, S, W, STRAIGHT, ELBOW, openings, rotate, exitFor } from '../src/logic/pieces.js';
import { PieceQueue } from '../src/logic/queue.js';
import { Grid } from '../src/logic/grid.js';
import { startFlow, advance } from '../src/logic/water.js';

const sorted = (a) => [...a].sort();
const mkGrid = (o = {}) => new Grid({ width: 4, height: 3, sourceRow: 1, drainRow: 1, ...o });

// Runs the water to a final state.
function run(grid) {
  let f = startFlow(grid);
  for (let i = 0; i < 100 && f.status === 'flowing'; i++) f = advance(grid, f);
  return f;
}

test('R-004 straight openings per rotation', () => {
  assert.deepEqual(sorted(openings(STRAIGHT, 0)), sorted([E, W]));
  assert.deepEqual(sorted(openings(STRAIGHT, 1)), sorted([N, S]));
});

test('R-004 elbow openings per rotation (default N+E, clockwise)', () => {
  assert.deepEqual(sorted(openings(ELBOW, 0)), sorted([N, E]));
  assert.deepEqual(sorted(openings(ELBOW, 1)), sorted([E, S]));
  assert.deepEqual(sorted(openings(ELBOW, 2)), sorted([S, W]));
  assert.deepEqual(sorted(openings(ELBOW, 3)), sorted([W, N]));
});

test('R-004 rotation cycles: straight 2 states, elbow 4', () => {
  assert.equal(rotate(STRAIGHT, 0), 1);
  assert.equal(rotate(STRAIGHT, 1), 0);
  let r = 0;
  for (let i = 0; i < 4; i++) r = rotate(ELBOW, r);
  assert.equal(r, 0);
});

test('exitFor returns the other opening, or null with no opening', () => {
  assert.equal(exitFor(STRAIGHT, 0, W), E);
  assert.equal(exitFor(ELBOW, 0, N), E);
  assert.equal(exitFor(ELBOW, 0, S), null);
});

test('R-003 queue shows N pieces and refills at the back', () => {
  const seq = [0, 0.9, 0, 0.9, 0, 0.9, 0.9, 0];
  let i = 0;
  const q = new PieceQueue(3, () => seq[i++]);
  assert.deepEqual(q.items, [STRAIGHT, ELBOW, STRAIGHT]);
  assert.equal(q.take(), STRAIGHT);
  assert.equal(q.items.length, 3);
  assert.deepEqual(q.items, [ELBOW, STRAIGHT, ELBOW]);
  assert.equal(q.peek(), ELBOW);
});

test('R-003 queue never runs out and yields both piece types', () => {
  const q = new PieceQueue(5);
  const seen = new Set();
  for (let i = 0; i < 200; i++) { seen.add(q.take()); assert.equal(q.items.length, 5); }
  assert.deepEqual(sorted(seen), sorted([STRAIGHT, ELBOW]));
});

test('R-004 placement rules', () => {
  const g = mkGrid({ blocked: [[2, 0]] });
  assert.equal(g.place(1, 1, STRAIGHT).ok, true);
  assert.deepEqual(g.getTile(1, 1), { type: STRAIGHT, rotation: 0, locked: false });
  assert.equal(g.place(1, 1, ELBOW).reason, 'occupied');
  assert.equal(g.place(2, 0, ELBOW).reason, 'blocked');
  assert.equal(g.place(-1, 1, ELBOW).reason, 'out-of-bounds'); // source side
  assert.equal(g.place(4, 1, ELBOW).reason, 'out-of-bounds');  // drain side
  assert.equal(g.getTile(1, 1).type, STRAIGHT); // not replaced
});

test('R-004 rotating placed tiles, and empty cells do nothing', () => {
  const g = mkGrid();
  g.place(0, 0, ELBOW);
  assert.equal(g.rotateTile(0, 0).ok, true);
  assert.equal(g.getTile(0, 0).rotation, 1);
  assert.equal(g.rotateTile(3, 2).reason, 'empty');
});

test('R-005 water locks a tile from the moment it enters', () => {
  const g = mkGrid();
  for (let x = 0; x < 4; x++) g.place(x, 1, STRAIGHT);
  const f = startFlow(g);
  assert.equal(f.status, 'flowing');
  assert.equal(g.getTile(0, 1).locked, true);
  assert.equal(g.getTile(1, 1).locked, false);
  assert.equal(g.rotateTile(0, 1).reason, 'locked');
  assert.equal(g.getTile(0, 1).rotation, 0);
});

test('R-006 water path that wins (straights plus an elbow detour)', () => {
  const g = mkGrid({ sourceRow: 1, drainRow: 1 });
  g.place(0, 1, STRAIGHT);
  g.place(1, 1, STRAIGHT);
  g.place(2, 1, STRAIGHT);
  g.place(3, 1, STRAIGHT);
  assert.equal(run(g).status, 'won');

  // Route that bends: row 0 -> down column 2 -> drain on row 2.
  const h = mkGrid({ sourceRow: 0, drainRow: 2 });
  h.place(0, 0, STRAIGHT);
  h.place(1, 0, STRAIGHT);
  h.place(2, 0, ELBOW); h.getTile(2, 0).rotation = 2; // S+W
  h.place(2, 1, STRAIGHT); h.getTile(2, 1).rotation = 1; // N+S
  h.place(2, 2, ELBOW); h.getTile(2, 2).rotation = 0; // N+E
  h.place(3, 2, STRAIGHT);
  assert.equal(run(h).status, 'won');
});

test('R-006 spill: gap (empty cell)', () => {
  const g = mkGrid();
  g.place(0, 1, STRAIGHT);
  g.place(1, 1, STRAIGHT);
  const f = run(g);
  assert.deepEqual([f.status, f.reason, f.x, f.y], ['spilled', 'gap', 2, 1]);
});

test('R-006 spill: dead end (tile has no opening facing the water)', () => {
  const g = mkGrid();
  g.place(0, 1, STRAIGHT);
  g.place(1, 1, STRAIGHT); g.rotateTile(1, 1); // vertical, faces away
  const f = run(g);
  assert.deepEqual([f.status, f.reason], ['spilled', 'dead-end']);
});

test('R-006 spill: blocked cell', () => {
  const g = mkGrid({ blocked: [[1, 1]] });
  g.place(0, 1, STRAIGHT);
  const f = run(g);
  assert.deepEqual([f.status, f.reason], ['spilled', 'blocked']);
});

test('R-006 spill: grid edge (elbow turns out of the grid)', () => {
  const g = mkGrid({ sourceRow: 0 });
  g.place(0, 0, ELBOW);
  g.rotateTile(0, 0); g.rotateTile(0, 0); g.rotateTile(0, 0); // W+N: leaves north
  const f = run(g);
  assert.deepEqual([f.status, f.reason], ['spilled', 'edge']);
});

test('R-006 empty first cell spills immediately; drain only wins on its row', () => {
  const g = mkGrid();
  assert.equal(startFlow(g).reason, 'gap');
  const h = mkGrid({ sourceRow: 0, drainRow: 2 });
  for (let x = 0; x < 4; x++) h.place(x, 0, STRAIGHT);
  const f = run(h);
  assert.deepEqual([f.status, f.reason], ['spilled', 'edge']); // wrong row
});
