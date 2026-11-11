import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLevel, parseLevel, LevelError, DEFAULT_QUEUE_SIZE } from '../src/logic/level.js';
import { loadLevel, loadAllLevels, LEVEL_COUNT, levelUrl } from '../src/levels.js';

const fileFetch = async (url) => {
  try {
    const text = readFileSync(new URL(`../${url}`, import.meta.url), 'utf8');
    return { ok: true, json: async () => JSON.parse(text) };
  } catch { return { ok: false, status: 404 }; }
};
const good = () => ({
  width: 6, height: 4, sourceRow: 1, drainRow: 2, blocked: [[2, 1]],
  queueSize: 5, startDelay: 10, waterSpeed: 0.5,
});

// Is there any route of free cells from the source cell to the drain cell?
function hasRoute(l) {
  const bad = new Set(l.blocked.map(([x, y]) => `${x},${y}`));
  const seen = new Set(['0,' + l.sourceRow]);
  const todo = [[0, l.sourceRow]];
  while (todo.length) {
    const [x, y] = todo.pop();
    if (x === l.width - 1 && y === l.drainRow) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= l.width || ny >= l.height || bad.has(k) || seen.has(k)) continue;
      seen.add(k); todo.push([nx, ny]);
    }
  }
  return false;
}

test('R-002 exactly 5 level files exist and each loads', async () => {
  assert.equal(LEVEL_COUNT, 5);
  const { levels, errors } = await loadAllLevels(fileFetch);
  assert.deepEqual(errors, []);
  assert.equal(levels.length, 5);
  assert.ok(levels.every(Boolean));
});

test('R-002 changing a value in the file changes the loaded level', async () => {
  const edited = async (url) => ({ ok: true, json: async () => ({ ...good(), waterSpeed: 2.5, blocked: [[3, 3]] }) });
  const l = await loadLevel(1, edited);
  assert.equal(l.waterSpeed, 2.5);
  assert.deepEqual(l.blocked, [[3, 3]]);
});

test('R-002 queueSize defaults to 5 when omitted', () => {
  const { queueSize, ...rest } = good();
  assert.equal(parseLevel(rest).queueSize, DEFAULT_QUEUE_SIZE);
});

test('R-002 invalid data gives readable errors, not a crash', () => {
  for (const key of ['width', 'height', 'sourceRow', 'drainRow', 'blocked', 'startDelay', 'waterSpeed']) {
    const d = good(); delete d[key];
    assert.ok(validateLevel(d).includes(`missing field "${key}"`), key);
  }
  const bad = (patch, re) => {
    const errs = validateLevel({ ...good(), ...patch });
    assert.ok(errs.some((e) => re.test(e)), `${JSON.stringify(patch)} -> ${errs}`);
  };
  bad({ blocked: [[9, 1]] }, /outside the 6x4 grid/);
  bad({ blocked: [[1, -1]] }, /outside/);
  bad({ blocked: [[1, 1], [1, 1]] }, /listed twice/);
  bad({ blocked: [[0, 1]] }, /source entry/);
  bad({ blocked: [[5, 2]] }, /drain entry/);
  bad({ blocked: 'x' }, /list of/);
  bad({ blocked: [['a', 1]] }, /whole numbers/);
  bad({ sourceRow: 4 }, /"sourceRow"/);
  bad({ drainRow: 1.5 }, /"drainRow"/);
  bad({ width: 'six' }, /"width"/);
  bad({ startDelay: 0 }, /"startDelay"/);
  bad({ waterSpeed: -1 }, /"waterSpeed"/);
  bad({ queueSize: 0 }, /"queueSize"/);
  assert.ok(validateLevel(null).length);
  assert.ok(validateLevel([]).length);
  assert.throws(() => parseLevel({}, 'level 9'), (e) => e instanceof LevelError && /level 9/.test(e.message));
});

test('R-002 a missing or broken file gives a readable LevelError', async () => {
  await assert.rejects(loadLevel(7, fileFetch), /Could not load level 7 .*HTTP 404/);
  const broken = async () => ({ ok: true, json: async () => { throw new SyntaxError('bad json'); } });
  await assert.rejects(loadLevel(1, broken), /Could not load level 1 .*bad json/);
  const { levels, errors } = await loadAllLevels(async (u) => (u === levelUrl(2) ? { ok: false, status: 500 } : fileFetch(u)));
  assert.equal(errors.length, 1);
  assert.equal(levels[1], null);
  assert.ok(levels[0] && levels[2]);
});

test('R-007 levels get harder and each has a free route', async () => {
  const { levels } = await loadAllLevels(fileFetch);
  levels.forEach((l, i) => assert.ok(hasRoute(l), `level ${i + 1} has a route`));
  const area = (l) => l.width * l.height;
  // R-007 lists the levers: smaller start delay, faster water, more blocked
  // cells or a larger grid. Each level must pull at least one of them. (Level 5
  // has a longer delay and slower water than level 4 on purpose: its route is
  // longer and its grid bigger, so it stays the hardest level, just fairer.)
  for (let i = 1; i < 5; i++) {
    const a = levels[i - 1], b = levels[i];
    const harder = b.startDelay < a.startDelay || b.waterSpeed > a.waterSpeed
      || b.blocked.length > a.blocked.length || area(b) > area(a);
    assert.ok(harder, `level ${i + 1} is harder than level ${i}`);
  }
});
