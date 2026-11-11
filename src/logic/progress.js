import { MAX_SCORE } from './score.js';

// Saved progress: unlocked levels (R-007) and best score per level (R-011).
// Pure apart from the injected `storage` (anything with getItem/setItem, e.g.
// localStorage). Never throws: missing storage, blocked storage or junk data
// fall back to "only level 1 unlocked, no scores" and the game keeps running.
export const PROGRESS_KEY = 'pipe-nightmare-progress';

// The browser's localStorage, or null when it is unavailable (private mode,
// blocked cookies, etc.). Accessing it can itself throw.
export function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

const validScore = (s) => Number.isInteger(s) && s >= 0 && s <= MAX_SCORE;

export class Progress {
  constructor(storage, levelCount = 5) {
    this.storage = storage;
    this.levelCount = levelCount;
    this.unlocked = 1; // highest unlocked level number, 1..levelCount
    this.best = {};    // level number -> best score
    this._load();
  }

  // Each saved field is checked on its own, so one bad value does not throw
  // away the others. Anything invalid counts as "not saved".
  _load() {
    let data;
    try {
      const raw = this.storage?.getItem(PROGRESS_KEY);
      if (raw == null) return;
      data = JSON.parse(raw);
    } catch { return; }
    if (data === null || typeof data !== 'object' || Array.isArray(data)) return;

    const n = data.unlocked;
    if (Number.isInteger(n) && n >= 1 && n <= this.levelCount) this.unlocked = n;

    if (data.best !== null && typeof data.best === 'object' && !Array.isArray(data.best)) {
      for (let level = 1; level <= this.levelCount; level++) {
        if (validScore(data.best[level])) this.best[level] = data.best[level];
      }
    }
  }

  isUnlocked(level) {
    return Number.isInteger(level) && level >= 1 && level <= this.unlocked;
  }

  // Winning level N unlocks N + 1 (never past the last level, never lowers).
  unlockNext(wonLevel) {
    const next = Math.min(this.levelCount, wonLevel + 1);
    if (next > this.unlocked) {
      this.unlocked = next;
      this._save();
    }
  }

  // Best score for a level, or null when there is none.
  bestScore(level) {
    return Object.hasOwn(this.best, level) ? this.best[level] : null;
  }

  // Keeps the higher score; a lower or equal score on a replay never
  // overwrites it. Returns true when `score` is a new best.
  recordScore(level, score) {
    if (!Number.isInteger(level) || level < 1 || level > this.levelCount || !validScore(score)) return false;
    const old = this.bestScore(level);
    if (old !== null && score <= old) return false;
    this.best[level] = score;
    this._save();
    return true;
  }

  _save() {
    try {
      this.storage?.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: this.unlocked, best: this.best }));
    } catch { /* storage full or blocked: keep playing, progress lasts this session */ }
  }
}
