import { parseLevel, LevelError } from './logic/level.js';

// Loads the level JSON files (R-002). The loader is separate from the
// validation rules so the rules can be tested without a browser.
export const LEVEL_COUNT = 5;
export const levelUrl = (n) => `levels/level${n}.json`;

// `fetchFn` is injectable for tests. Throws LevelError with a readable message.
export async function loadLevel(n, fetchFn = fetch) {
  const label = `level ${n} (${levelUrl(n)})`;
  let data;
  try {
    const res = await fetchFn(levelUrl(n));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    throw new LevelError(`Could not load ${label}: ${err.message}`);
  }
  return parseLevel(data, label);
}

// Loads every level; returns { levels, errors } so one bad file does not
// hide the others.
export async function loadAllLevels(fetchFn = fetch) {
  const levels = [];
  const errors = [];
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    try { levels.push(await loadLevel(n, fetchFn)); } catch (err) { levels.push(null); errors.push(err.message); }
  }
  return { levels, errors };
}
