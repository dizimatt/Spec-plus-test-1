// Saved progress: which levels are unlocked (R-007, R-010). Pure apart from
// the injected `storage` (anything with getItem/setItem, e.g. localStorage).
// Never throws: missing storage, blocked storage or junk data all fall back to
// "only level 1 unlocked" and the game keeps running.
export const PROGRESS_KEY = 'pipe-nightmare-progress';

// The browser's localStorage, or null when it is unavailable (private mode,
// blocked cookies, etc.). Accessing it can itself throw.
export function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export class Progress {
  constructor(storage, levelCount = 5) {
    this.storage = storage;
    this.levelCount = levelCount;
    this.unlocked = this._load(); // highest unlocked level number, 1..levelCount
  }

  _load() {
    try {
      const raw = this.storage?.getItem(PROGRESS_KEY);
      if (raw == null) return 1;
      const data = JSON.parse(raw);
      const n = data?.unlocked;
      if (Number.isInteger(n) && n >= 1 && n <= this.levelCount) return n;
    } catch { /* fall through to the safe default */ }
    return 1;
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

  _save() {
    try {
      this.storage?.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: this.unlocked }));
    } catch { /* storage full or blocked: keep playing, progress lasts this session */ }
  }
}
